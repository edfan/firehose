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

    # Pull all terms into a single list for each class
    for term in os.listdir('data/'):
        with open('data/' + term, 'rb') as f:
            term_dict = pickle.load(f)
        for k, v in term_dict.items():
            if k not in classes:
                classes[k] = []
            classes[k].append(v)

    # Compute an average and stick it in index 0
    for k, v in classes.items():
        term_count = len(v)
        average = { 'term': 'average',
                    'rating': 0,
                    'ic_hours': 0,
                    'oc_hours': 0,
                    'class_name': v[-1]['class_name'] }

        for term in v:
            average['rating'] += term['rating']
            average['ic_hours'] += term['ic_hours']
            average['oc_hours'] += term['oc_hours']

        average['rating'] /= term_count
        average['ic_hours'] /= term_count
        average['oc_hours'] /= term_count

        classes['k'] = [average] + v
            
    classes = sorted([{k: v} for k, v in classes.items()],
                     key=natural_keys)
            
    with open('www/evaluations.json', 'w') as f:
        f.write('var evals = ')
        json.dump(classes, f)
        f.write(';')

if __name__ == '__main__':
    getcontext().prec = 1
    main()
