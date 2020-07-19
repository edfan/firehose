import json
import requests
import re
from bs4 import BeautifulSoup

base_url = "http://student.mit.edu/catalog/search.cgi?search="

with open('all_classes') as f:
    class_list = json.load(f)

classes = {}

for c in class_list:
    try:
        while True:
            try:    
                r = requests.get(base_url + c, timeout=5)
                break
            except requests.exceptions.ConnectionError:
                pass
        soup = BeautifulSoup(r.content, "lxml")

        start = soup.h3
        num = c

        classes[num] = {'no_next': False,
                        'repeat': False,
                        'url': ''}

        level = start.findNext('img').findNext('img')

        if 'nonext' in str(level):
            classes[num]['no_next'] = True
            level = level.findNext('img')
        
        if 'Undergrad' in str(level):
            classes[num]['level'] = 'U'
        elif 'Graduate' in str(level):
            classes[num]['level'] = 'G'

        gterms = ['Fall', 'IAP', 'Spring', 'Summer']
        terms = [level.findNext()]
        while True:
            next_term = terms[-1].findNext()
            if not any(x in str(next_term) for x in gterms):
                break
            terms.append(next_term)

        others = [terms[-1]]
        while True:
            next_other = others[-1].findNext()
            if str(next_other) == '<br/>':
                break
            others.append(next_other)
            
        for other in others:
            if 'repeat.gif' in str(other):
                classes[num]['repeat'] = True
            
        url = soup.getText().split('URL: ')
        if len(url) > 1:
            classes[num]['url'] = url[1].split('\n')[0].strip('?')

        classes[num]['final'] = '+final' in soup.getText()

        print(num)
    except (AttributeError, TypeError) as e:
        print("Failed:", num)
        print(e)

with open("sublist", 'w') as f:
    json.dump(classes, f)
