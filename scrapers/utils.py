import json


def get_term_info():
    """Get the latest term info."""
    with open("../public/latestTerm.json") as f:
        term_info = json.load(f)
    return term_info


def get_term_catalog_name():
    """Get the latest term's catalog name, e.g. 2023FA for Fall 2022."""
    url_name = get_term_info()["urlName"]
    semester = url_name[0]
    year = int(url_name[1:])
    if semester == "f":
        # catalog names are based on school year, so +1 to real year
        return f"20{year + 1}FA"
    elif semester == "s":
        return f"20{year}SP"
    else:
        return f"20{year}JA"
