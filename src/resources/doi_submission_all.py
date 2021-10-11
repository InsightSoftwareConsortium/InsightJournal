#!/usr/bin/env python

"""
Apply doi_submission_generator to all pubs
"""

import argparse
import copy
import os
import sys
from pathlib import Path
import subprocess

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate valid XML from metadata.json for Crossref submission')

    parser.add_argument("-i", "--input-folder", dest="input_folder",
                        help="Path to parent folder: publications. publications/{pub_id}/metadata.json.")
    parser.add_argument("-s", "--input-script", dest="input_script",
                        help="Path to script: Example: doi_submission_generator.py.")
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
    parser.add_argument("--dry", dest="dry", action='store_true',
                        help="Do not run the command.")
    parser.add_argument("-o, --output-folder", dest="output_folder", default="/tmp",
                        help="Output folder to write down the filled xml before uploading to crossref.")

    args = parser.parse_args()
    print(args)


    input_folder_path = Path(args.input_folder).expanduser().absolute()
    if not input_folder_path.exists:
        raise RuntimeError("input_folder cannot be found: {}".format(str(input_folder_path)))
    input_script_path = Path(args.input_script).expanduser().absolute()
    if not input_script_path.exists:
        raise RuntimeError("input_script cannot be found: {}".format(str(input_script_path)))

    # python doi_submission_generator.py
    command_base = sys.executable +  " " + str(input_script_path)

    args_template = {
        "input_metadata": "", # Fill this with the target metadata.json path
        "verbose" : "--verbose" if args.verbose else "",
        "validate" : "--validate" if args.validate else "",
        "upload" : "--upload" if args.upload else "",
        "email" : "--email " + args.email,
        "password" : "--password " + args.password,
        "test": "--test" if args.test else "",
        "output_folder": "--output-folder " + args.output_folder
    }

    print(args_template)
    args_string_template = "--input-metadata {input_metadata} {verbose} {validate} {upload} {email} {password} {test} {output_folder}"

    with os.scandir(input_folder_path) as publication_folder:
        for pub in publication_folder:
            publication_id = pub.name
            print("publication_id:", publication_id)
            metadata_path = Path(pub.path) / "metadata.json"
            if not metadata_path.exists():
                print("  Warning: no metadata.json for pub {}".format(publication_id))
                continue
            # populate the args
            args_dict = copy.deepcopy(args_template)
            args_dict["input_metadata"] = str(metadata_path)
            args_string = args_string_template.format(**args_dict)

            # build the final command
            command = command_base + " " + args_string
            # print(args_template)
            # print(args_string)
            # print(command)
            if not args.dry:
                subprocess.run(args=command, shell=True, check=True)
