#! /usr/bin/env python3

import selenium
import time
import pickle
from selenium import webdriver
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoSuchElementException

username = 'edwardf'
with open('password', 'r') as f:
    password = f.read().strip()

eval_url = 'https://edu-apps.mit.edu/ose-rpt/subjectEvaluationSearch.htm'
courses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 20, 22, 24, 'AS', 'EC', 'MS',
           'NS', '21A', '21G', '21H', '21L', '21M', '21W', 'CMS', 'CON', 'CSB', 'ESD', 'ESG', 'HST',
           'ISP', 'MAS', 'STS', 'WGS']

terms = ['2014FA', '2014SP', '2014SU', '2015FA', '2015SP', '2015SU', '2016FA', '2016SP', '2016SU']

class_dict = {}

def url_from_course(course):
    return eval_url + '?departmentId={:+>4}&search=Search'.format(course)

def url_from_term(term):
    return eval_url + '?termId={}&search=Search'.format(term)

def mit_duo_login():
    session = webdriver.Chrome()
    session.get(eval_url)

    # Fill in Kerberos login form
    username_field = session.find_element_by_name('j_username')
    password_field = session.find_element_by_name('j_password')
    username_field.send_keys(username)
    password_field.send_keys(password)

    session.find_element_by_name('Submit').click()

    # Send push Duo authentication
    WebDriverWait(session, 10).until(EC.frame_to_be_available_and_switch_to_it('duo_iframe'))
    duo_button = session.find_element_by_xpath('//*[contains(text(), "Send Me a Push")]')
    duo_button.click()

    WebDriverWait(session, 30).until(EC.title_is('Subject Evaluation Report Search'))

    return session

def scrape_class_info(session, class_element):
    url = class_element.get_attribute('href')
    class_element.click()

    title_element = session.find_element_by_xpath("/html/body/div[@id='contentsframe']/table[@class='header']/tbody/tr[1]/td[@class='subjectTitle']/h1")
    titles = title_element.text.split('\n')

    course_numbers = [t.split(' ')[0] for t in titles]
    course_name = ' '.join(titles[0].split(' ')[1:])

    rating_element = session.find_element_by_xpath("/html/body/div[@id='contentsframe']/table[@class='header']/tbody/tr[2]/td[@class='summaryContainer']/table[@class='summary']/tbody/tr/td[4]/p")
    rating = rating_element.text[27:30]

    ic_hours_element = session.find_element_by_xpath("/html/body/div[@id='contentsframe']/table[@class='indivQuestions'][3]/tbody/tr[4]/td[@class='avg']")
    ic_hours = ic_hours_element.text

    oc_hours_element = session.find_element_by_xpath("/html/body/div[@id='contentsframe']/table[@class='indivQuestions'][3]/tbody/tr[5]/td[@class='avg']")
    oc_hours = oc_hours_element.text

    print(course_numbers[0], course_name, rating, ic_hours, oc_hours, url)

    for n in course_numbers:
        class_dict[n] = (course_name, rating, ic_hours, oc_hours, url)

    session.execute_script("window.history.go(-1)")
    

def main():
    session = mit_duo_login()

    for term in terms:
        session.get(url_from_term(term))

        for i in range(4, 5000):
            try:
                class_element = session.find_element_by_xpath("/html/body/div[@id='wrapper']/div[@id='rh-col']/p[{}]/a".format(i))
                scrape_class_info(session, class_element)
            except NoSuchElementException:
                break

        f = open('data/' + term, 'wb')
        pickle.dump(class_dict, f)
        f.close()
        
if __name__ == '__main__':
    main()
    
    

    
