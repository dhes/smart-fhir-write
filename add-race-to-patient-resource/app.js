"use strict";
// let pt={};
this.FHIR.oauth2
  .ready()
  .then(function (smart) {
    // Render the current patient (or any error)
    smart.patient.read().then(
      function (pt) {
        // console.log(JSON.stringify(pt));
        document.getElementById("ptNameAndId").innerText =
          pt.name[0].given[0] + " " + pt.name[0].family + " ID: " + pt.id + " ";
        // pull patient race category
        // if there is a patient extension:
        if (Object.prototype.hasOwnProperty.call(pt, "extension")) {
          // ...then look for a us core race url:
          let usCoreRaceExtensionIndex = pt.extension.findIndex(
            (a) =>
              a.url ===
              "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race"
          ); // -1 if no such extension
          // console.log(usCoreRaceExtensionIndex);
          // if there is a usCoreRaceExtension, look for a url=ombCategory below it:
          if (usCoreRaceExtensionIndex != -1) {
            let ombCategoryExtensionIndex = pt.extension[
              usCoreRaceExtensionIndex
            ].extension.findIndex((a) => a.url === "ombCategory");
            // and get the 'race' code from it.
            var ombRaceCategoryCode =
              pt.extension[usCoreRaceExtensionIndex].extension[
                ombCategoryExtensionIndex
              ].valueCoding.code;
            console.log("ombRaceCategoryCode = " + ombRaceCategoryCode);
          }
        }
        // use the 'race' code to populate the radio buttons:
        switch (ombRaceCategoryCode) {
          case "1002-5":
            document.getElementById("nativeAmerican").checked = true;
            break;
          case "2028-9":
            document.getElementById("asianAmerican").checked = true;
            break;
          case "2054-5":
            document.getElementById("africanAmerican").checked = true;
            break;
          case "2076-8":
            document.getElementById("pacificIslander").checked = true;
            break;
          case "2106-3":
            document.getElementById("europeanAmerican").checked = true;
            break;
        }
        document.getElementById("raceForm").onsubmit = function () {
          setRaceCategory(event, pt, smart);
        };
        document.getElementById("removeRaceForm").onsubmit = function () {
          removeRaceCategory(event, pt, smart);
        };
        document.getElementById("lipids").onsubmit = function () {
          setLipids(event, pt, smart);
        };
        document.getElementById("submitRace").disabled = false;
        document.getElementById("removeRace").disabled = false;
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
// assume no need to verify existence of an OMB 'race' entry
function removeRaceCategory(e, pt, smart) {
  e.preventDefault();
  let usCoreRaceExtensionIndex = pt.extension.findIndex(
    (a) =>
      a.url === "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race"
  );
  alert("remove2: " + usCoreRaceExtensionIndex);
  pt.extension.splice(usCoreRaceExtensionIndex, 1); // ... at the usCoreRaceExtensionIndex position, remove 1 array element. This method leaves no 'undefined' holes.
  alert("pt.extension.length = " + pt.extension.length);
  // remove patient.extension property if extension array is empty
  if (pt.extension.length === 0) {
    delete pt.extension;
  }
  alert(
    "patient has an extension" +
      Object.prototype.hasOwnProperty.call(pt, "extension")
  );
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
function setLipids(e, pt, smart) {
  e.preventDefault();
  var totalCholesterol = Number(
    document.getElementById("totalCholesterol").value
  );
  var totalCholesterolDate = document.getElementById(
    "totalCholesterolDate"
  ).value;
  console.log(totalCholesterolDate);
  var ldlCalcCholesterol = Number(
    document.getElementById("ldlCalcCholesterol").value
  );
  var ldlCalcCholesterolDate = document.getElementById(
    "ldlCalcCholesterolDate"
  ).value;
  var hdlCholesterol = Number(document.getElementById("hdlCholesterol").value);
  var hdlCholesterolDate = document.getElementById("hdlCholesterolDate").value;
  console.log(
    "totalCholesterol = " +
      totalCholesterol +
      " " +
      "totalCholesterolDate = " +
      totalCholesterolDate
  );
  console.log(
    "ldlCalcCholesterol = " +
      ldlCalcCholesterol +
      " " +
      "ldlCalcCholesterolDate = " +
      ldlCalcCholesterolDate
  );
  console.log(
    "hdlCholesterol = " +
      hdlCholesterol +
      " " +
      "hdlCholesterolDate = " +
      hdlCholesterolDate
  );
  // patient CompleteInformation AscvdRisk FemaleSmoker, William M Robinson
  // total cholesterol 2093-3
  // LDLc cholesterol 13457-7
  // LDL direct assay 18262-6
  // hdl cholesterol- 2085-9
  // you need a prefetch to pull out all lipid observation
  let labObsTemplate = {
    resourceType: "Observation",
    status: "final",
    category: [
      {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "laboratory",
            display: "Laboratory",
          },
        ],
        text: "Laboratory",
      },
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "", // e.g. "13457-7"
          display: "", // e.g. "LDLc SerPl Calc-mCnc"
        },
      ],
      text: "LDLc SerPl Calc-mCnc", // e.g. "LDLc SerPl Calc-mCnc",
    },
    subject: {
      reference: "Patient/" + pt.id, // e.g. "Patient/smart-967332",
    },
    effectiveDateTime: ldlCalcCholesterolDate, // e.g. "2008-03-16"
    valueQuantity: {
      value: void 0, // e.g. 72
      unit: "mg/dL",
      system: "http://unitsofmeasure.org",
      code: "mg/dL",
    },
  };
  function populateLabObs(labObs, labValue, labDate, labCode, labDisplay) {
    // let labObs = labObsTemplate;
    // labObs.subject.reference = "Patient/" + pt.id;
    labObs.valueQuantity.value = labValue;
    labObs.effectiveDateTime = labDate;
    labObs.code.coding[0].code = labCode; // e.g. "2093-3";
    labObs.code.coding[0].display = labDisplay; // e.g. "Cholesterol [Mass/volume] in Serum or Plasma";
    labObs.code.text = labDisplay; // e.g. "Cholesterol [Mass/volume] in Serum or Plasma";
    smart.create(labObs).then(function (error) {
      document.getElementById("ptNameAndId").innerText = error.stack;
    });
  }
  // total cholesterol
  populateLabObs(
    labObsTemplate,
    totalCholesterol,
    totalCholesterolDate,
    "2093-3",
    "Cholesterol [Mass/volume] in Serum or Plasma"
  );

  // LDLc cholesterol
  populateLabObs(
    labObsTemplate,
    ldlCalcCholesterol,
    ldlCalcCholesterolDate,
    "13457-7",
    "Cholesterol in LDL [Mass/volume] in Serum or Plasma by calculation"
  );

  // HDL cholesterol
  populateLabObs(
    labObsTemplate,
    hdlCholesterol,
    hdlCholesterolDate,
    "2085-9",
    "Cholesterol in HDL [Mass/volume] in Serum or Plasma"
  );
  // smoking history entry
}
let smokingObsTemplate = {
  resourceType: "Observation",
  status: "final",
  code: {
    coding: [
      {
        system: "http://loinc.org",
        code: "72166-2",
        display: "Tobacco smoking status",
      },
    ],
    text: "Tobacco smoking status",
  },
  subject: {
    reference: "Patient/" + pt.id, // e.g. "Patient/f7048ede-a570-4c13-985f-8f3d673d1eeb",
  },
  issued: "", // e.g. "2018-04-05T00:00:00.000Z" or just "201804-05"
  valueCodeableConcept: {
    coding: [
      {
        system: "http://snomed.info/sct",
        code: "", // e.g. "266919005", "65568007", "8517006"
        display: "", //e.g. "Never smoked tobacco (finding)", "Cigarette smoker (finding)", "Ex-smoker (finding)""
      },
    ],
    text: "", // e.g. "Never smoked tobacco (finding)",
  },
};
