from scrapers import coursews
from scrapers import catalog
from scrapers import package


def run():
    print("=== Update schedule data ===")
    coursews.run()
    print("=== Update catalog data ===")
    catalog.run()
    print("=== Packaging ===")
    package.run()


if __name__ == "__main__":
    run()
