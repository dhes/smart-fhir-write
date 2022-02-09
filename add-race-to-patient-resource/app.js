"use strict";
// let pt={};
this.FHIR.oauth2
  .ready()
  .then(function (smart) {
    // Render the current patient (or any error)
    smart.patient.read().then(
      function (pt) {
        console.log(JSON.stringify(pt));
        document.getElementById("ptNameAndId").innerText =
          pt.name[0].given[0] + " " + pt.name[0].family + " ID: " + pt.id + " ";
        // pull patient race category:
        // if there is a patient extension:
        if (Object.prototype.hasOwnProperty.call(pt, "extension")) {
          let usCoreRaceExtensionIndex = pt.extension.findIndex(
            (a) =>
              a.url ===
              "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race"
          ); // -1 if no such extension
          console.log(usCoreRaceExtensionIndex);
          if (usCoreRaceExtensionIndex != -1) {
            let ombCategoryExtensionIndex = pt.extension[
              usCoreRaceExtensionIndex
            ].extension.findIndex((a) => a.url === "ombCategory");
            var ombRaceCategoryCode =
              pt.extension[usCoreRaceExtensionIndex].extension[
                ombCategoryExtensionIndex
              ].valueCoding.code;
            console.log("ombRaceCategoryCode = " + ombRaceCategoryCode);
          }
        }
        switch (ombRaceCategoryCode) {
            {    case "nativeAmerican":
            race.extension[0].valueCoding.code = "1002-5";
            race.extension[0].valueCoding.display =
              "American Indian or Alaska Native";
            race.extension[1].valueString = "American Indian or Alaska Native";
            break;
          case "asianAmerica":
            race.extension[0].valueCoding.code = "2028-9";
            race.extension[0].valueCoding.display = "Asian";
            race.extension[1].valueString = "Asian";
            break;
          case "africanAmerican":
            race.extension[0].valueCoding.code = "2054-5";
            race.extension[0].valueCoding.display = "Black or African American";
            race.extension[1].valueString = "Black or African American";
            break;
          case "pacificIslander":
            race.extension[0].valueCoding.code = "2076-8";
            race.extension[0].valueCoding.display =
              "Native Hawaiian or Other Pacific Islander";
            race.extension[1].valueString =
              "Native Hawaiian or Other Pacific Islander";
            break;
          case "europeanAmerican":
            race.extension[0].valueCoding.code = "2106-3";
            race.extension[0].valueCoding.display = "White";
            race.extension[1].valueString = "White";
            break;
      }
        document.getElementById("raceForm").onsubmit = function () {
          setRaceCategory(event, pt, smart);
        };
        document.getElementById("submit").disabled = false;
      },
      function (error) {
        document.getElementById("ptNameAndId").innerText = error.stack;
      }
    );
  })
  .catch(console.error);
// test the value
function setRaceCategory(e, pt, smart) {
  // prevent get and reload default behavior
  e.preventDefault();
  let raceSelection = getRadioVal(document.getElementById("raceForm"), "race");
  console.log(raceSelection);
  let baseRace = {
    url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
    extension: [
      {
        url: "ombCategory",
        valueCoding: {
          system: "urn:oid:2.16.840.1.113883.6.238",
          // code: "2106-3",
          // display: "White",
        },
      },
      {
        url: "text",
        // valueString: "White",
      },
    ],
  };
  let race = baseRace;
  // your gonna have to tell em'... for purposes of caluculating risk, everybody is considered 'europeanAmerican' unless thay are 'africanAmerica'
  switch (raceSelection) {
    case "nativeAmerican":
      race.extension[0].valueCoding.code = "1002-5";
      race.extension[0].valueCoding.display =
        "American Indian or Alaska Native";
      race.extension[1].valueString = "American Indian or Alaska Native";
      break;
    case "asianAmerica":
      race.extension[0].valueCoding.code = "2028-9";
      race.extension[0].valueCoding.display = "Asian";
      race.extension[1].valueString = "Asian";
      break;
    case "africanAmerican":
      race.extension[0].valueCoding.code = "2054-5";
      race.extension[0].valueCoding.display = "Black or African American";
      race.extension[1].valueString = "Black or African American";
      break;
    case "pacificIslander":
      race.extension[0].valueCoding.code = "2076-8";
      race.extension[0].valueCoding.display =
        "Native Hawaiian or Other Pacific Islander";
      race.extension[1].valueString =
        "Native Hawaiian or Other Pacific Islander";
      break;
    case "europeanAmerican":
      race.extension[0].valueCoding.code = "2106-3";
      race.extension[0].valueCoding.display = "White";
      race.extension[1].valueString = "White";
      break;
  }
  console.log(race);
  console.log(pt);
  if (Object.prototype.hasOwnProperty.call(pt, "extension")) {
    // console.log("this patient resource has an extension");
    pt["extension"].push(race);
  } else {
    // console.log("this patient resource does not have an extension");
    pt["extension"] = [race];
  }
  console.log(pt);
  smart
    .update(pt)
    .catch(function (e) {
      alert(
        "An error occured with updating the patient \n" + JSON.stringify(e)
      );
      throw e;
    })
    .then(function (bundle) {
      alert("Patient update succeeded!");
      return bundle;
    });
}
// DH this form code is from https://www.dyn-web.com/tutorials/forms/radio/get-selected.php
function getRadioVal(form, name) {
  var val;
  // get list of radio buttons with specified name
  var radios = form.elements[name];

  // loop through list of radio buttons
  for (var i = 0, len = radios.length; i < len; i++) {
    if (radios[i].checked) {
      // radio checked?
      val = radios[i].value; // if so, hold its value in val
      break; // and break out of for loop
    }
  }
  return val; // return value of checked radio or undefined if none checked
}
