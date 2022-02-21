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
        // use the 'race' code to populate the radio buttons:å
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
        document.getElementById("smokingStatus").onsubmit = function () {
          setSmokingStatus(event, pt, smart);
        };
        document.getElementById("bloodPressure").onsubmit = function () {
          setBloodPressure(event, pt, smart);
        };
        document.getElementById("ascvdRisk").onsubmit = function () {
          setAscvdRisk(event, pt, smart);
        };
        document.getElementById("medicationRequest").onsubmit = function () {
          addMedicationRequest(event, pt, smart);
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
  // let raceSelection = getRadioVal(document.getElementById("raceForm"), "race");
  // ...or...
  let raceSelection = document.querySelector(
    "input[name = race]:checked"
  ).value;
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
function setSmokingStatus(e, pt, smart) {
  e.preventDefault();
  let today = new Date();
  // let todayString = today.toISOString().substring(0, 10);
  let smokingObsTemplate = {
    resourceType: "Observation",
    status: "final",
    category: [
      {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "social-history",
            display: "Social History",
          },
        ],
        text: "Social History",
      },
    ],
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
    effectiveDateTime: europeStyleDate(today), // e.g. "2018-04-05T00:00:00.000Z" or just "201804-05"
    valueCodeableConcept: {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "", // e.g. "65568007"
          display: "", //e.g. "Cigarette smoker (finding)"
        },
      ],
      text: "", // e.g. "Cigarette smoker (finding)"
    },
  };
  console.log(
    "smokingObsTemplate.effectiveDateTime =" +
      smokingObsTemplate.effectiveDateTime
  );
  var smokingStatus = document.querySelector(
    "input[name = smokingStatus]:checked"
  ).value;
  // console.log(smokingStatus);
  let smokingStatusObs = smokingObsTemplate;
  switch (smokingStatus) {
    case "currentSmoker":
      smokingStatusObs.valueCodeableConcept.coding[0].code = "65568007";
      smokingStatusObs.valueCodeableConcept.coding[0].display =
        "Cigarette smoker (finding)";
      smokingStatusObs.valueCodeableConcept.text = "Cigarette smoker (finding)";
      break;
    case "exSmoker":
      smokingStatusObs.valueCodeableConcept.coding[0].code = "8517006";
      smokingStatusObs.valueCodeableConcept.coding[0].display =
        "Ex-smoker (finding)";
      smokingStatusObs.valueCodeableConcept.text = "Ex-smoker (finding)";
      break;
    case "neverSmoker":
      smokingStatusObs.valueCodeableConcept.coding[0].code = "266919005";
      smokingStatusObs.valueCodeableConcept.coding[0].display =
        "Never smoked tobacco (finding)";
      smokingStatusObs.valueCodeableConcept.text =
        "Never smoked tobacco (finding)";
      break;
  }
  smart
    .create(smokingStatusObs)
    // .then(function (error) {
    //   document.getElementById("ptNameAndId").innerText = error.stack;
    // });
    .catch(function (e) {
      alert("An error occured with the update");
      throw e;
    })
    .then(function (bundle) {
      alert("Patient update succeeded!");
      return bundle;
    });
}
function europeStyleDate(d) {
  let twoDigitMonth = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
  });
  let twoDigitDay = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
  });
  let fourDigitYear = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
  });

  let dateString =
    fourDigitYear.format(d) +
    "-" +
    twoDigitMonth.format(d) +
    "-" +
    twoDigitDay.format(d);
  return dateString;
}
function setBloodPressure(e, pt, smart) {
  e.preventDefault();
  var systolicBloodPressure = Number(
    document.getElementById("systolicBloodPressure").value
  );
  var diastolicBloodPressure = Number(
    document.getElementById("diastolicBloodPressure").value
  );
  var bloodPressureDate = document.getElementById("bloodPressureDate").value;
  // console.log(systolicBloodPressure, diastolicBloodPressure, bloodPressureDate);
  let bloodPressureObs = {
    resourceType: "Observation",
    status: "final",
    category: [
      {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs",
            display: "Vital Signs",
          },
        ],
        text: "Vital Signs",
      },
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "85354-9",
          display: "Blood pressure panel with all children optional",
        },
      ],
      text: "Blood pressure panel with all children optional",
    },
    subject: {
      reference: "Patient/" + pt.id, // e.g. "Patient/smart-967332"
    },
    effectiveDateTime: bloodPressureDate, // e.g. "2001-09-15"
    component: [
      {
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "8480-6",
              display: "Systolic blood pressure",
            },
          ],
          text: "Systolic blood pressure",
        },
        valueQuantity: {
          value: systolicBloodPressure, // e.g. 178,
          unit: "mmHg",
          system: "http://unitsofmeasure.org",
          code: "mm[Hg]",
        },
      },
      {
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "8462-4",
              display: "Diastolic blood pressure",
            },
          ],
          text: "Diastolic blood pressure",
        },
        valueQuantity: {
          value: diastolicBloodPressure, // e.g. 119,
          unit: "mmHg",
          system: "http://unitsofmeasure.org",
          code: "mm[Hg]",
        },
      },
    ],
  };
  smart
    .create(bloodPressureObs)
    // .then(function (error) {
    //   document.getElementById("ptNameAndId").innerText = error.stack;
    // });
    .catch(function (e) {
      alert("An error occured with the update");
      throw e;
    })
    .then(function (bundle) {
      alert("Patient update succeeded!");
      return bundle;
    });
}
function setAscvdRisk(e, pt, smart) {
  e.preventDefault();
  var ascvdRiskPercent = Number(
    document.getElementById("ascvdRiskPercent").value
  );
  let today = new Date();
  let ascvdRiskObs = {
    resourceType: "Observation",
    subject: {
      reference: "Patient/" + pt.id, // e.g. "Patient/a6c7f012-0b32-4048-8c8b-27d2763b8cdc",
    },
    status: "final",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "79423-0",
          display:
            "Cardiovascular disease 10Y risk [Likelihood] ACC-AHA Pooled Cohort by Goff 2013",
        },
      ],
      text: "Cardiovascular disease 10Y risk [Likelihood] ACC-AHA Pooled Cohort by Goff 2013",
    },
    valueQuantity: {
      value: ascvdRiskPercent, // e.g. 15.1
      unit: "%",
      system: "http://unitsofmeasure.org",
      code: "%",
    },
    effectiveDateTime: europeStyleDate(today), // e.g. "2021-04-05"
  };
  console.log(ascvdRiskObs);
  smart
    .create(ascvdRiskObs)
    // .then(function (error) {
    //   document.getElementById("ptNameAndId").innerText = error.stack;
    // });
    .catch(function (e) {
      alert("An error occured with the update");
      throw e;
    })
    .then(function (bundle) {
      alert("Patient update succeeded!");
      return bundle;
    });
}
// add a statin
function addMedicationRequest(e, pt) {
  e.preventDefault();
  let medicationName = document.getElementById("medicationName").value;
  let rxNormId = document.getElementById("rxNormId").value;
  let dateAuthored = document.getElementById("dateAuthored").value;
  let dosageInstructions = document.getElementById("dosageInstructions").value;
  let dosageFrequency = Number(
    document.getElementById("dosageFrequency").value
  );
  let dosagePeriod = Number(document.getElementById("dosagePeriod").value);

  // let dosagePeriodUnitElement = document.getElementById("dosagePeriodUnit");
  // dosagePeriodUnitElement.addEventListener("change", setDosagePeriodUnit());
  // let dosagePeriodUnit = dosagePeriodUnitElement.value;
  let dosagePeriodUnitElement = document.getElementById("dosagePeriodUnit");

  let dispenseRequestQuantity = Number(
    document.getElementById("dispenseRequestQuantity").value
  );

  // let dispenseRequestQuantityUnitElement = document.getElementById("dispenseRequestQuantityUnit");
  // dispenseRequestQuantityUnitElement.addEventListener("change", setDispenseRequestQuantityUnit());
  // let dispenseRequestQuantityUnit = dispenseRequestQuantityUnitElement.value;
  let dispenseRequestQuantityUnitElement = document.getElementById(
    "dispenseRequestQuantityUnit"
  );

  let expectedDuration = Number(
    document.getElementById("expectedDuration").value
  );

  // let expectedDurationUnitElement = document.getElementById("expectedDurationUnit");
  // expectedDurationUnitElement.addEventListener("change", setExpectedDurationUnit());
  // let expectedDurationUnit = expectedDurationUnitElement.value;
  let expectedDurationUnitElement = document.getElementById(
    "expectedDurationUnit"
  );

  let numberOfRepeatsAllowed = Number(
    document.getElementById("numberOfRepeatsAllowed").value
  );

  console.log(
    medicationName,
    rxNormId,
    dateAuthored,
    dosageInstructions,
    dosageFrequency,
    dosagePeriod,
    // dosagePeriodUnit,
    dispenseRequestQuantity,
    // dispenseRequestQuantityUnit,
    expectedDuration,
    // expectedDurationUnit,
    numberOfRepeatsAllowed
  );
  let medicationRequestTemplate = {
    resourceType: "MedicationRequest",
    status: "active",
    intent: "order",
    medicationCodeableConcept: {
      coding: [
        {
          system: "http://www.nlm.nih.gov/research/umls/rxnorm",
          code: rxNormId, // e.g. "859751"
          display: medicationName, // e.g. "rosuvastatin calcium 20 MG oral tablet",
        },
      ],
      text: medicationName, // e.g. "rosuvastatin calcium 20 MG oral tablet",
    },
    subject: {
      reference: "Patient/" + pt.id,
    },
    authoredOn: dateAuthored, // e.g. "2022-02-01"
    dosageInstruction: [
      {
        text: dosageInstructions, // e.g. "1 qhs"
        timing: {
          repeat: {
            boundsPeriod: {
              start: dateAuthored, // e.g. "2022-01-02"
            },
            frequency: dosageFrequency, // e.g. 1
            period: dosagePeriod, // e.g. 1
            periodUnit: dosagePeriodUnitElement.value.split("|")[0], // e.g. "d"
          },
        },
        route: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "26643006",
              display: "Oral Route (qualifier value)",
            },
          ],
        },
      },
    ],
    dispenseRequest: {
      numberOfRepeatsAllowed: numberOfRepeatsAllowed, // e.g. 3
      quantity: {
        value: dispenseRequestQuantity, // e.g. 90
        unit: dispenseRequestQuantityUnitElement.value.split("|")[1], // e.g. "tablet"
        system: "http://terminology.hl7.org/ValueSet/v3-orderableDrugForm",
        code: dispenseRequestQuantityUnitElement.value.split("|")[0], // e.g. "TAB"
      },
      expectedSupplyDuration: {
        value: expectedDuration, // e.g.  90
        unit: expectedDurationUnitElement.value.split("|")[1], // e.g. "days"
        system: "http://unitsofmeasure.org",
        code: expectedDurationUnitElement.value.split("|")[0], // e.g. "d"
      },
    },
    requester: [
      {
        reference: "Practitioner/smart-Practitioner-71614502",
        display: "Susan A. Clark",
      },
    ],
  };
  console.log(medicationRequestTemplate);
}
// function setDosagePeriodUnit() {
//   let dosagePeriodUnitList = document.getElementById("dosagePeriodUnit");
//   let dosagePeriodUnit =
//     dosagePeriodUnitList.options[dosagePeriodUnitList.selectedIndex];
//   // console.log(dosagePeriodUnit);
// }
function setDispenseRequestQuantityUnit() {
  let dispenseRequestQuantityUnitList = document.getElementById(
    "dispenseRequestQuantityUnit"
  );
  let dispenseRequestQuantityUnit =
    dispenseRequestQuantityUnitList.options[
      dispenseRequestQuantityUnitList.selectedIndex
    ];
  // console.log(dispenseRequestQuantityUnit);
}
function setExpectedDurationUnit() {
  let expectedDurationUnitList = document.getElementById(
    "expectedDurationUnit"
  );
  let expectedDurationUnit =
    expectedDurationUnitList.options[expectedDurationUnitList.selectedIndex];
  // console.log(expectedDurationUnit);
}
