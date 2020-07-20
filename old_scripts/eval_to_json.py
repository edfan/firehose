#! /usr/bin/env python3

import simplejson as json
import pickle
import os
import re
from decimal import *

def atoi(text):
    return int(text) if text.isdigit() else text

def natural_keys(d):
    text = next(iter(d.keys()))
    return [atoi(c) for c in re.split('(\d+)', text)]

def main():
    classes = {}
    professors = set()

    # Pull all terms into a single list for each class
    for term in os.listdir('../../firehose-priv/data/'):
        with open('../../firehose-priv/data/' + term, 'rb') as f:
            term_dict = pickle.load(f)
        for k, v in term_dict.items():
            if k not in classes:
                classes[k] = []
            classes[k].append(v)
            for prof in v['professors']:
                professors.add(prof['name'])
            
    with open('evaluations.json', 'w') as f:
        f.write('var evals = ')
        json.dump(classes, f)
        f.write(';')

    with open('../new_scripts/evaluations', 'w') as f:
        json.dump(classes, f)

    with open('professors.json', 'w') as f:
        f.write('var professors = ')
        json.dump(list(professors), f)
        f.write(';')

if __name__ == '__main__':
    getcontext().prec = 2
    main()
