#!/usr/bin/env python

"""
Update publications dois from the doi_master_list.csv file
"""

from doi_submission_generator import read_current_dois

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
import pypandoc # requires pandoc-jats in the system
import warnings
from natsort import natsorted

def _check_handles(publication_folder):
    """ DEBUG purposes """
    publication_folder_path = Path(args.publication_folder)
    publication_folders = natsorted([str(f) for f in publication_folder_path.iterdir() if f.is_dir()])
    for pub in publication_folders:
        pub_path = Path(pub)
        publication_id = pub_path.stem
        metadata_path = pub_path / "metadata.json"
        if not metadata_path.exists():
            warnings.warn("No metadata.json for pub {}".format(publication_id))
            continue

        with open(metadata_path, "r") as metadata_file:
            metadata = json.load(metadata_file)
            metadata = metadata["publication"]
        revisions = metadata["revisions"]
        pubs_with_many_revisions = []
        if len(revisions) > 1:
            pubs_with_many_revisions.append(publication_id)
            handles = []
            for revision in revisions:
                handle_url_prefix = "http://hdl.handle.net"
                handle = revision["handle"]
                handles.append(handle_url_prefix + "/" + handle)
                # print(response.status_code)

        print(pubs_with_many_revisions)
        return pubs_with_many_revisions


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Update publications with the doi stored in doi_master_list.')

    parser.add_argument("-i", "--input-doi-master-list", dest="input_doi_master_list",
                        help="Path to doi_master_list.cv associated to publication.", type=str, default="./doi_master_list.csv")
    parser.add_argument("-p", "--publication-folder", dest="publication_folder",
                        help="Path to the publications folder.", type=str, default="../../data/publications")
    parser.add_argument("-v", "--verbose",
                        dest="verbose", action='store_true',
                        help="Print info to stdout.")
    args = parser.parse_args()
    print(args)

    print("Reading doi_master_list.csv")

    all_dois_d = read_current_dois()
    publication_folder_path = Path(args.publication_folder)
    publication_folders = natsorted([str(f) for f in publication_folder_path.iterdir() if f.is_dir()])
    for pub in publication_folders:
        pub_path = Path(pub)
        publication_id = pub_path.stem
        print("-" * 40)
        print(f"Publication {publication_id}:")
        metadata_path = pub_path / "metadata.json"
        if not metadata_path.exists():
            warnings.warn("No metadata.json for pub {}".format(publication_id))
            continue
        with open(metadata_path, "r") as metadata_file:
            metadata = json.load(metadata_file)
            metadata = metadata["publication"]
        revisions = metadata["revisions"]
        if len(revisions) > 1:
            # TODO: At time of writting there are no publications with more than one revision
            warnings.warn(f"Publication {publication_id} has more than one revision. Skipping, modify logic of this function or clean it up.")
            continue
        revision = revisions[0]
        doi_from_pub = revision["doi"]
        doi_from_master_list = all_dois_d[publication_id]["doi_full"]
        print(f" - Publication {publication_id} has doi_from_pub: {doi_from_pub} and doi_from_master_list: {doi_from_master_list}")
        if not doi_from_master_list:
            warnings.warn(f"Publication {publication_id} has no doi_from_master_list. Generate it first. Skipping")
            continue
        if doi_from_pub and doi_from_pub != doi_from_master_list:
            raise RuntimeError(f"Publication {publication_id} has a doi_from_pub {doi_from_pub} different than doi_from_master_list {doi_from_master_list}. FIX IT.")
        if not doi_from_pub:
            # Copy it from master list
            metadata["revisions"][0]["doi"] = doi_from_master_list

        # save doi back to metadata file
        with open(metadata_path, "w") as metadata_file:
            print(f" - Writing doi to metadata.json")
            metadata = {"publication": metadata}
            json.dump(metadata, metadata_file, indent=2, sort_keys=True)


