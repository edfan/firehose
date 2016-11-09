#! /usr/bin/env python3

import json
import pickle
import os
import re

def atoi(text):
    return int(text) if text.isdigit() else text

def natural_keys(d):
    text = next(iter(d.keys()))
    return [atoi(c) for c in re.split('(\d+)', text)]

def main():
    classes = {}
    
    for term in os.listdir('data/'):
        with open('data/' + term, 'rb') as f:
            term_dict = pickle.load(f)
        for k, v in term_dict.items():
            if k not in classes:
                classes[k] = []
            ct_dict = {
                'term': term,
                'course_number': v[0],
                'class_number': v[1],
                'class_name': v[2],
                'rating': v[3],
                'ic_hours': v[4],
                'oc_hours': v[5]}
            classes[k].append(ct_dict)

    classes = sorted([{k: v} for k, v in classes.items()],
                     key=natural_keys)
            
    with open('www/evaluations.json', 'w') as f:
        f.write('var evals = ')
        json.dump(classes, f)
        f.write(';')

if __name__ == '__main__':
    main()
