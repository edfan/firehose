export function Header() {
  return (
    <>
      <div id="spacer3-div"></div>
      <div id="info-div">
        <img src="img/logo.png" height="40px" />
        <p>
          <a href="semesters/i22/iap.html">IAP 2022</a> | Spring 2022
        </p>
        <form>
          <select
            defaultValue="index.html"
            name="semesters"
            id="semesters"
            onChange={(e) => {
              const elt = e.target;
              window.location.href = elt.options[elt.selectedIndex].value;
            }}
          >
            <option value="index.html">
              Spring 2022
            </option>
            <option value="semesters/i22/iap.html">IAP 2022</option>
            <option value="semesters/f21/fall.html">Fall 2021</option>
            <option value="semesters/s21/spring.html">Spring 2021</option>
            <option value="semesters/f20/fall.html">Fall 2020</option>
            <option value="semesters/s20/spring.html">Spring 2020</option>
            {/* <option value="semesters/i20/iap.html">IAP 2020</option> */}
            <option value="semesters/f19/fall.html">Fall 2019</option>
            <option value="semesters/s19/spring.html">Spring 2019</option>
            <option value="semesters/i19/iap.html">IAP 2019</option>
            <option value="semesters/f18/fall.html">Fall 2018</option>
            <option value="semesters/s18/spring.html">Spring 2018</option>
            <option value="semesters/i18/iap.html">IAP 2018</option>
            <option value="semesters/f17/fall.html">Fall 2017</option>
          </select>
        </form>
        <span id="info-line">
          Note that ratings reflect class evals prior to Spring 2020.
        </span>
      </div>
    </>
  );
}
