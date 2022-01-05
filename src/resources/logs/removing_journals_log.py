journals ids:
Midas: 31
ITK: 3
VTK:


journal list:


###  MICCAI 2008 Workshops (7 journals, 7 issues)####
journal_id: 33
publications

issues related: [
333: Computational Biomechanics, journal: 39
334: Systems and Architectures, journal: 40
335: Computational and visualization challenges, journal:41 EMPTY
338: Grand Challenge: Coronary Artery Tracking, journal: 43
339: MS Lesion Segmentation, journal: 44
340: Grand Challenge Liver Tumor Segmentation, journal: 45
341: Manifolds in Medical Imaging: Metrics, Learning and Beyond, journal: 46
]

# Issue -> Journal
{
###  MICCAI 2008 Workshops (7 journals, 7 issues)####
333: 39, # DONE
334: 40, # DONE
# 335: 41, #EMPTY, REMOVED
338: 43, # DONE
339: 44, # DONE
340: 45, # DONE
341: 46,
######## Medical Image and Computing (2009) ############
351: 52,
######## Computional Algorithms (2011) ############
363: 61,
########## OSVIS 2014 #########
376: 70,
########## OSVIS 2014 #########
# Empty, deleted
388: 77,
########## MICCAI 2009 ######### journal 34
# journal 47 (Systems and Architectures for Computer Assisted Interventions)
342: 47,
# journal 48 (Carotid)
343: 48,
# journal 49 (Cardiac MR left)
348: 49,
# journal 50 (Head and Neck auto)
349: 50,
########## MICCAI 2010 ######### journal 37
# journal 55 (Computer Assisted)
354: 55,
# journal 57 (Computation Imaging Biomarkers for Tumors (CIBT))
359: 57,
########## MICCAI 2011 ######### journal 38
362: 60,
########## MICCAI 2012 ######### journal 40
362: 65,
########## MICCAI 2013 ######### journal 41
# journal 69 Grand Challenge MR Brain Segmentation)
375: 69,
# journal 67 (systems and architectures)
371: 67,
########## MICCAI 2014 ######### journal 42
# journal 75 (Image-Guided Adaptive Radiation Therapy)
383: 75,
# journal 76 (Challenge on Endocardial )
387: 76,
########## MICCAI 2015 ######### journal 44
# journal 80 (Head and Neck auto)
408: 80,
# journal 79 (Spectral Analysis in Medical Imaging)
400: 79
########## MICCAI 2016 ######### journal 45
# journal 79 (Spectral Analysis in Medical Imaging)
# EMPTY
}
# Issue -> Journal





```python

import os
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

p2i = publication_to_issue_dict()


import os
from pathlib import Path
import json
def publication_per_issue(issue_id):
    current_path = Path(__file__).parent.absolute()
    path_issues = current_path / "../../data/issues/"
    path_issue = path_issues / "{}.json".format(issue_id)
    print(path_issue)
    with open(path_issue, 'r') as file:
        issue_metadata = json.load(file)
        issue_id = issue_metadata['issue']['issue_id']
        pubs = issue_metadata['issue']['publications']
        return pubs

def replace_journal(publications, new_journal_id = 31, new_journal_name="The MIDAS Journal"):
    current_path = Path(__file__).parent.absolute()
    path_publications = current_path / "../../data/publications/"
    for pub in publications:
        pub_path = path_publications / str(pub) / "metadata.json"
        with open(pub_path, 'r') as file:
            pub_metadata = json.load(file)
            journals = pub_metadata["publication"]["journals"]
            if len(journals) > 1:
                print("WARNING: multiple journals. Removing them and replacing to only one.")
            journal = {}
            journal["journal_id"] = int(new_journal_id)
            journal["journal_name"] = new_journal_name
            pub_metadata["publication"]["journals"] = []
            pub_metadata["publication"]["journals"] = [journal]
            json.dump(pub_metadata, open(pub_path, 'w'), indent=2, sort_keys=True)


