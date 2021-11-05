#!/usr/bin/env python

"""
- Read template (with placeholders: i.e `{journal_title}`)
- Populate python dictionary from metadata.json from publication_id
- Use template+dictionary to generate a xml.
- Validate xml. Ensure utf-8 enoding.
- Submit to crossref using HTTP post request.
"""

ij_doi_prefix = "10.54294"
ij_journals_issn = {
    3: "2327-770X", # insight
    31: None, # midas
    35: "2328-3459" # vtk
}
ij_web_prefix = "https://www.insight-journal.org"

import argparse
import json
import os
from lxml import (etree, builder)
from pathlib import Path

from datetime import datetime
from dateutil.parser import parse as dateutil_parse
import random
import csv
import string
import secrets
import requests


def read_current_dois():
    """
    Read the stored doi's associated to every publication.
    Return a dict where keys are publication ids.
    {
    '000': {
        'doi_suffix': '12345678901234',
        'doi_full': '10.54294/12345678901234',
        'doi_url': 'https://doi.org/10.54294/12345678901234'
        },
    }
    Note: Read from file.
    """
    current_path = Path(__file__).parent.absolute()
    doi_master_list_path = current_path / "doi_master_list.csv"
    pubs_to_doi = {}
    with open(doi_master_list_path) as file:
        reader = csv.reader(file, delimiter=',')
        field_names = []
        for row in reader:
            if reader.line_num == 1:
                field_names = row
                continue
            if row:
                pubs_to_doi[row[0]] = dict(zip(field_names[1:], row[1:]))

    return pubs_to_doi

def get_doi_list_from_dict(pubs_to_doi):
    """
    Helper function to return a list with dois from dictionary from read_current_dois.
    """
    all_dois = [
        doi_dict_value
        for doi_dict in pubs_to_doi.values()
        for doi_dict_key, doi_dict_value in doi_dict.items() if doi_dict_key == "doi_suffix"
    ]
    return all_dois

def get_doi_list():
    """
    Get all the dois stored in the file.
    Note: Read from file.
    """
    pubs_to_doi = read_current_dois()
    return get_doi_list_from_dict(pubs_to_doi)


def generate_unique_doi_suffix():
    """
    Read all stored dois and generate a new and unique doi suffix.

    Return
    ------
    A new unique doi
    """

    all_dois = get_doi_list()

    alphabet = string.ascii_lowercase + string.digits
    doi_length = 6

    id = ''
    id_is_unique = False
    while not id_is_unique:
        id = ''.join(secrets.choice(alphabet) for i in range(doi_length))
        id_is_unique = not id in all_dois
    return id

def doi_full_from_doi_suffix(doi_suffix):
    """
    Generate a full doi (prefix + suffix) from doi_suffix
    """
    return ij_doi_prefix + "/" + str(doi_suffix)

def doi_url_from_doi_suffix(doi_suffix):
    """
    Generate a doi_url (https://doi.org/ + prefix + suffix) from doi_suffix
    """
    return "https://doi.org/" + doi_full_from_doi_suffix(doi_suffix)

def append_publication_doi(publication_id, doi_suffix):
    """
    Append a new row to the storage doi file with publication_id and publication_suffix.
    Note: Write to file
    """
    current_path = Path(__file__).parent.absolute()
    doi_master_list_path = current_path / "doi_master_list.csv"
    new_row = [
        str(publication_id),
        str(doi_suffix),
        doi_full_from_doi_suffix(doi_suffix),
        doi_url_from_doi_suffix(doi_suffix)
    ]

    with open(doi_master_list_path, 'a', newline='') as file:
        # lineterminator (and newline) is needed to avoid extra carriage return ^M
        writer = csv.writer(file, lineterminator='\n')
        writer.writerow(new_row)

def get_or_create_doi_suffix_for_publication(publication_id):
    """
    Get or create a doi_suffix from a publication_id.
    If the publication_id already exists in the storage file, it simply returns it.
    If there is no doi associated to the publication_id, this creates one (write to file).
    Note: Read (and write if not exists) to file
    """
    publication_id = str(publication_id)
    pubs_to_doi = read_current_dois()
    if publication_id in pubs_to_doi:
        doi_dict = pubs_to_doi[publication_id]
        return doi_dict["doi_suffix"]
    else:
        new_doi_suffix = generate_unique_doi_suffix()
        append_publication_doi(publication_id, new_doi_suffix)
        return new_doi_suffix

def id_from_time():
    """
    Used only for crossref doi_batch communication.
    Generate a string of numbers generated from now time (UTC)
    plus a random factor (last 6 digits).
    """
    # 6 digits random number, to "avoid" time collisions. It won't reliably work on heavy duty.
    random_str = f'{random.randrange(1, 10**6):06}'
    # UTC time up to microseconds
    time_str = datetime.utcnow().strftime('%d%m%Y%H%M%S%f')
    return time_str + random_str

def publication_to_issue_dict():
    """
    Create a dictionary {publication_id:issue_id}.
    Reading all the json files from the issues folder.
    """
    current_path = Path(__file__).parent.absolute()
    path_issues = current_path / "../../data/issues/"
    pub_to_issues = dict()

    with os.scandir(path_issues) as it:
        for entry in it:
            if entry.name.endswith(".json") and entry.is_file():
                with open(entry.path) as file:
                    issue_metadata = json.load(file)
                    issue_id = issue_metadata['issue']['issue_id']
                    pubs = issue_metadata['issue']['publications']
                    for p in pubs:
                        if not p in pub_to_issues:
                            pub_to_issues[p] = [issue_id]
                        else:
                            pub_to_issues[p].append(issue_id)

    return pub_to_issues


def build_xml_dictionary(metadata, verbose=False):
    """
    Return a meta_xml dictionary with all the information needed
    to fill the doi_submission_template.xml placeholders.
    """

    meta_xml = {}

    # Populate XML with publication metadata
    E = builder.ElementMaker() # lxml builder

    ############## head #####################
    # For submission to crossref purposes only
    meta_xml["doi_batch_id"] = id_from_time()
    meta_xml["timestamp"] = datetime.utcnow().strftime('%d%m%Y%H%M%S')

    ############## body #####################
    # journal
    journals = metadata.get("journals")
    if not len(journals) == 1:
        raise RuntimeError("Unexpected Data: Not handled when publication belongs to more than one journal")
    meta_xml["journal_name"] = journals[0]["journal_name"]
    journal_id = journals[0]["journal_id"]

    meta_xml["journal_issn_xml"] = '' #handle the null case
    if journal_id: # not null
        # issn
        journal_issn = ij_journals_issn.get(journal_id)
        if journal_issn: # Journal with issn
            journal_issn_tag = E.issn(
                journal_issn,
                media_type="electronic")
            meta_xml["journal_issn_xml"] = etree.tostring(journal_issn_tag, encoding='unicode')

    # journal_issue: issue
    pub_to_issues = publication_to_issue_dict()
    publication_id = metadata.get("publication_id")
    if publication_id:
        publication_id = str(publication_id)
    issue_id = pub_to_issues.get(publication_id)
    meta_xml["journal_issue_xml"] = ''
    if issue_id:
        # <journal_issue><issue>3</issue></journal_issue>
        journal_issue_tag = E.journal_issue( E.issue(str(issue_id)) )
        meta_xml["journal_issue_xml"] = etree.tostring(journal_issue_tag, encoding='unicode')

    ########## journal_article ###############
    # title: is already in metadata dict
    meta_xml["title"] = metadata.get("title")

    # contributors:
    meta_xml["contributors_xml"] = ""
    authors = metadata["authors"]
    if authors:
        # sort by author_place, not always the first author is place 1
        # in our metadata (but is the smallest number)
        authors.sort(key=lambda x: x.get("author_place"))
        contributors_tag = E.contributors()
        for place, author in enumerate(authors):
            person_name_tag = E.person_name(contributor_role="author")
            if place == 0: # the first place
                person_name_tag.attrib['sequence'] = "first"
            else:
                person_name_tag.attrib['sequence'] = "additional"

            # If author is a persona (IJ user):
            firstname = ""
            lastname = ""
            persona_firstname = author.get("persona_firstname")
            persona_lastname = author.get("persona_lastname")
            author_fullname = author.get("author_fullname")
            author_fullname_name_splits = []
            if author_fullname:
                author_fullname_name_splits = author_fullname.split(",")
                if len(author_fullname_name_splits) != 2:
                    print("WARNING: author_fullname has more or less than 2 fieldsseparated by comma ',': {}".format(author_fullname_name_splits))

            if not persona_firstname and not persona_lastname and author_fullname:
                firstname = author_fullname_name_splits[1].strip()
                lastname = author_fullname_name_splits[0].strip()
            else:
                if persona_firstname:
                    firstname = persona_firstname
                else:
                    firstname = author_fullname_name_splits[1].strip()

                if persona_lastname:
                    lastname = persona_lastname
                else:
                    lastname = author_fullname_name_splits[0].strip()

            if firstname:
                person_name_tag.append(E.given_name(firstname))
            if lastname:
                person_name_tag.append(E.surname(lastname))
            # TODO ORCID of the author goes here

            contributors_tag.append(person_name_tag)
        meta_xml["contributors_xml"] = etree.tostring(contributors_tag, encoding='unicode')

    # publication_date:
    meta_xml["publication_date_xml"] = ''
    date_submitted = metadata["date_submitted"]
    if date_submitted and date_submitted != "null":
        date_submitted_datetime = dateutil_parse(date_submitted)
        publication_date_xml = E.publication_date()
        date_periods = ['month', 'day', 'year']
        for period in date_periods:
            date_submitted_period = getattr(date_submitted_datetime, period)
            if date_submitted_period:
                publication_date_xml.append(getattr(E, period)(str(date_submitted_period)))

        meta_xml["publication_date_xml"] = etree.tostring(publication_date_xml, encoding='unicode')

    # citation_list:
    meta_xml["citation_list_xml"] = ''
    revisions = metadata.get("revisions")
    if revisions:
        # Only one revision for now
        revision_index = 0
        citation_list = revisions[revision_index].get("citation_list")
        if citation_list:
            citation_list_tag = E.citation_list()
            for citation in citation_list:
                citation_tag = E.citation(key=citation["key"])
                citation_doi = citation.get("doi")
                # Write only doi if we have it
                # If not, unstructured text (used in queries to crossref)
                if citation_doi:
                    citation_tag.append(E.doi(citation_doi))
                else:
                    citation_tag.append(
                        E.unstructured_citation(citation["unstructured"]))

                citation_list_tag.append(citation_tag)

            etree.indent(citation_list_tag, level=5)
            meta_xml["citation_list_xml"] = etree.tostring(citation_list_tag, encoding='unicode', pretty_print=True)

    # doi_data
    # Assign a doi to this publication and populate xml
    doi_suffix = get_or_create_doi_suffix_for_publication(publication_id)
    meta_xml["formatted_doi"] = doi_full_from_doi_suffix(doi_suffix)
    meta_xml["ij_resource_url"] = ij_web_prefix + "/browse/publication/" + publication_id
    # TODO add direct urls to article.pdf and source code
    collection_xml = ''
    # <collection property="text-mining">
    #   <item>
    #     <resource mime_type="application/pdf">{ij_resource_url}.pdf</resource>
    #   </item>
    # </collection>
    meta_xml["collection_xml"] = collection_xml

    if verbose:
        print("meta_xml:")
        print(meta_xml)

    return meta_xml


def validate_xml(xmldoc_to_validate):
    current_path = Path(__file__).parent.absolute()
    xmlschema_path = current_path / "schemas" / "crossref4.4.2.xsd"
    xmlschema_doc = etree.parse(str(xmlschema_path))
    xmlschema = etree.XMLSchema(xmlschema_doc)
    validation = xmlschema.validate(xmldoc_to_validate)
    if not validation:
        log = xmlschema.error_log
        # error = log.last_error
        return validation, log
    else:
        return validation, None

def write_xml(xmldoc, file_path):
    try:
        xmldoc.write(file_path, pretty_print=True, xml_declaration=True, encoding="utf-8")
    except:
        etree.ElementTree(xmldoc).write(file_path, pretty_print=True, xml_declaration=True, encoding="utf-8")

def upload_to_crossref(email, password, use_test_server = False):
    pass

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate valid XML from metadata.json for Crossref submission')

    parser.add_argument("-i", "--input-metadata", dest="input_metadata",
                        help="Path to metadata.json associated to publication.")
    parser.add_argument("-v", "--verbose",
                        dest="verbose", action='store_true',
                        help="Print the output dict")
    parser.add_argument("--validate", dest="validate", action='store_true',
                        help="Validate XML locally. Warning: slow.")
    parser.add_argument("--upload", dest="upload", action='store_true',
                        help="Upload to crossref.")
    parser.add_argument("--email", dest="email", default=None,
                        help="Upload to crossref. Credentials, email (and role for shared credentials). Example with role: myemail@abc.com/myrole")
    parser.add_argument("--password", dest="password", default=None,
                        help="Upload to crossref. Credentials, password")
    parser.add_argument("--test", dest="test", action='store_true',
                        help="Upload to crossref. But use test server.")
    parser.add_argument("-o","--output-folder", dest="output_folder", default="/tmp",
                        help="Output folder to write down the filled xml before uploading to crossref.")
    args = parser.parse_args()
    print(args)

    if not Path.exists(Path(args.input_metadata)):
        raise FileNotFoundError("input_metadata not found")

    with open(args.input_metadata, "r") as metadata_file:
        metadata = json.load(metadata_file)
        metadata = metadata["publication"]

    # Read our XML template
    current_path = Path(__file__).parent.absolute()
    tree = etree.parse(str(current_path / "doi_submission_template.xml"))
    tree_st = etree.tostring(tree.getroot(), pretty_print=True, encoding='unicode', method="xml")

    meta_xml = build_xml_dictionary(metadata=metadata, verbose=args.verbose)

    tree_filled_st = tree_st.format(**meta_xml)

    if args.verbose:
        print(tree_filled_st)

    tree_filled = etree.fromstring(tree_filled_st)

    if args.validate:
        result, log = validate_xml(tree_filled)
        print("XML VALID?", result)
        if log:
            print("log", log)
        if not result:
            raise AssertionError("Validation failed, check log printed in stdout")
    if args.upload:
        # Write xml file first
        publication_id = str(metadata["publication_id"])
        output_folder_path = Path(args.output_folder).expanduser().absolute()
        output_file = str(output_folder_path / (publication_id + ".xml"))
        write_xml(tree_filled, str(output_file))
        server_url = "https://doi.crossref.org/servlet/deposit"
        if args.test:
            server_url = "https://test.crossref.org/servlet/deposit"

        files = {'mdFile': open(output_file, 'rb')}
        payload = {
            'operation': 'doMDUpload',
            'login_id': str(args.email),
            'login_passwd': str(args.password)
        }

        r = requests.post(server_url, files=files, data=payload)
        if args.verbose:
            # Will raise if not ok (status_code == requests.codes.ok (i.e 200))
            r.raise_for_status()
            print(r.url)
            print()
            print(r.text)


    if args.verbose:
        print("Done for metadata:", args.input_metadata)

