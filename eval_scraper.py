#! /usr/bin/env python3

import selenium
from selenium import webdriver
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import NoSuchElementException

import time
import pickle
from decimal import *

username = 'edwardf'
with open('password', 'r') as f:
    password = f.read().strip()

eval_url = 'https://edu-apps.mit.edu/ose-rpt/subjectEvaluationSearch.htm'
courses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 20, 22, 24, 'AS', 'EC',
           'MS', 'NS', '21A', '21G', '21H', '21L', '21M', '21W', 'CMS', 'CON', 'CSB', 'ESD',
           'ESG', 'HST', 'ISP', 'MAS', 'STS', 'WGS']

terms = ['2015FA', '2015JA', '2015SP', '2015SU',
         '2016FA', '2016JA', '2016SP', '2016SU']

def url_from_course(course):
    return eval_url + '?departmentId={:+>4}&search=Search'.format(course)

def url_from_term(term):
    return eval_url + '?termId={}&search=Search'.format(term)

def mit_duo_login():
    session = webdriver.Chrome()
    session.get(eval_url)

    # Fill in Kerberos login form
    session.find_element_by_name('j_username').send_keys(username)
    session.find_element_by_name('j_password').send_keys(password)

    session.find_element_by_name('Submit').click()

    # Send push Duo authentication
    WebDriverWait(session, 10).until(EC.frame_to_be_available_and_switch_to_it('duo_iframe'))
    session.find_element_by_xpath('//*[contains(text(), "Send Me a Push")]').click()

    # Wait until base page loads
    WebDriverWait(session, 60).until(EC.title_is('Subject Evaluation Report Search'))

    return session

def scrape_class_info(session, class_element, class_dict, term):
    # Click link and wait until report loads
    url = class_element.get_attribute('href')
    class_element.click()
    WebDriverWait(session, 60).until(EC.title_contains('Report for'))

    # Classes can have different numbers & different names
    titles = session.find_element_by_xpath("/html/body/div[@id='contentsframe']/table[@class='header']/tbody/tr[1]/td[@class='subjectTitle']/h1").text.split('\n')

    class_numbers = [t.split(' ')[0] for t in titles]
    class_names = [' '.join(t.split(' ')[1:]) for t in titles]

    # Add static ratings/stats to dict
    cd = {}
    cd['term'] = term
    cd['url'] = url
    
    cd['rating'] = Decimal(session.find_element_by_xpath("/html/body/div[@id='contentsframe']/table[@class='header']/tbody/tr[2]/td[@class='summaryContainer']/table[@class='summary']/tbody/tr/td[4]/p").text[27:30])

    cd['ic_hours'] = Decimal(session.find_element_by_xpath("/html/body/div[@id='contentsframe']/table[@class='indivQuestions'][3]/tbody/tr[4]/td[@class='avg']").text)

    cd['oc_hours'] = Decimal(session.find_element_by_xpath("/html/body/div[@id='contentsframe']/table[@class='indivQuestions'][3]/tbody/tr[5]/td[@class='avg']").text)

    cd['eligible'] = int(session.find_element_by_xpath("/html/body/div[@id='contentsframe']/table[@class='header']/tbody/tr[2]/td[@class='summaryContainer']/table[@class='summary']/tbody/tr/td[1]").text.split()[3])

    cd['resp'] = int(session.find_element_by_xpath("/html/body/div[@id='contentsframe']/table[@class='header']/tbody/tr[2]/td[@class='summaryContainer']/table[@class='summary']/tbody/tr/td[2]").text.split()[4])

    cd['rate'] = int(session.find_element_by_xpath("/html/body/div[@id='contentsframe']/table[@class='header']/tbody/tr[2]/td[@class='summaryContainer']/table[@class='summary']/tbody/tr/td[3]").text.split()[2].rstrip('%'))

    # Add professors to dict
    cd['professors'] = []

    try:
        for x in range(3, 100):
            prof = {}

            prof['name'] = session.find_element_by_xpath("/html/body/div[@id='contentsframe']/table[@class='grid']/tbody/tr[{}]/td[1]/a/strong".format(x)).text

            prof['rating'] = Decimal(session.find_element_by_xpath("/html/body/div[@id='contentsframe']/table[@class='grid']/tbody/tr[{}]/td[5]/span[@class='avg']".format(x)).text)

            prof['role'] = session.find_element_by_xpath("/html/body/div[@id='contentsframe']/table[@class='grid']/tbody/tr[{}]/td[1]".format(x)).text.replace(prof['name'], '').rstrip('(RLECAB)').strip(' ,')

            cd['professors'].append(prof)
                
    except NoSuchElementException:
        pass        
    

    # Fits perfectly in a cmd window
    print('{:8} | {:48.48} | {} | {} | {}'.format(class_numbers[0], class_names[0], cd['rating'], cd['ic_hours'], cd['oc_hours']))

    for i in range(len(titles)):
        class_num_split = class_numbers[i].split('.')
        cd['course_number'] = class_num_split[0]
        cd['class_number'] = class_num_split[1]
        cd['class_name'] = class_names[i]
        
        class_dict[class_numbers[i]] = cd
        
    # Error-resistant back, then wait for search page
    session.execute_script("window.history.go(-1)")
    WebDriverWait(session, 60).until(EC.title_is('Search Results'))
    
def main():
    session = mit_duo_login()

    for term in terms:
        class_dict = {}
        
        print('\n\n\n'.format(term))
        session.get(url_from_term(term))

        # To cover all possible errors, just keep trying links
        for i in range(4, 2000):
            try:
                class_element = session.find_element_by_xpath("/html/body/div[@id='wrapper']/div[@id='rh-col']/p[{}]/a".format(i))
                scrape_class_info(session, class_element, class_dict, term)
            except NoSuchElementException:
                continue

        if class_dict != {}:
            with open('data/' + term, 'wb') as f:
                pickle.dump(class_dict, f)
        
if __name__ == '__main__':
    main()
    
    

    
