# TODO: rewrite from coursews.py
from scrapers import utils
import json


def fetch(term):
    ...


def parse_class(classes, cls):
    ...


def parse_session(classes, session):
    ...


def run():
    term = utils.get_term_catalog_name()
    raw_classes = fetch(term)
    classes = {}
    for cls in raw_classes:
        if cls["type"] == "Class":
            parse_class(classes, cls)
    for cls in raw_classes:
        if cls["type"] != "Class":
            parse_session(classes, cls)
    with open("classes.json", "w") as f:
        json.dump(classes, f)
    with open("all_classes.json", "w") as f:
        json.dump(list(classes.keys()), f)
