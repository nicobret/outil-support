require("../mongo");
const esClient = require("../es");

const AgentModel = require("../models/agent");
const TicketModel = require("../models/ticket");
const ContactModel = require("../models/contact");
const MessageModel = require("../models/message");
const TagModel = require("../models/tag");
const FolderModel = require("../models/folder");
const ShortcutModel = require("../models/shortcut");

(async () => {
  console.log("START DELETE ALL AGENTS");
  await AgentModel.deleteMany({});
  console.log("END DELETE ALL AGENTS");

  console.log("START CREATE AGENTS");
  const arr = [];
  arr.push({ firstName: "Agént1", lastName: "Agent1", email: "Agent1@gmail.com", _id: "620fa564547a8add6c78c481", role: "AGENT" });
  arr.push({ firstName: "Agent2", lastName: "Agent2", email: "Agent2@gmail.com", _id: "620fa564547a8add6c78c482", role: "AGENT" });
  arr.push({ firstName: "Agent3", lastName: "Agent3", email: "Agent3@gmail.com", _id: "620fa564547a8add6c78c483", role: "AGENT" });
  arr.push({ firstName: "Agent4", lastName: "Agent4", email: "Agent4@gmail.com", _id: "620fa564547a8add6c78c484", role: "AGENT" });
  arr.push({ firstName: "Sébastien", lastName: "Le goff", email: "se.legoff@gmail.com", _id: "620fa564547a8add6c78c485", role: "ADMIN" });

  for (let i = 0; i < arr.length; i++) {
    await AgentModel.create(arr[i]);
  }
  console.log("END CREATE AGENTS");
})();

(async () => {
  console.log("START DELETE ALL CONTACTS");
  await ContactModel.deleteMany({});
  console.log("END DELETE ALL CONTACTS");

  console.log("START CREATE CONTACTS");
  const arr = [];
  arr.push({ firstName: "Côntact1", lastName: "Contact1", email: "contact1@gmail.com", _id: "620fa564547a8add6c78c471" });
  arr.push({ firstName: "Contact2", lastName: "Contact2", email: "contact2@gmail.com", _id: "620fa564547a8add6c78c472" });
  arr.push({ firstName: "Contact3", lastName: "Contact3", email: "contact3@gmail.com", _id: "620fa564547a8add6c78c473" });
  arr.push({ firstName: "Contact4", lastName: "Contact4", email: "contact4@gmail.com", _id: "620fa564547a8add6c78c474" });

  for (let i = 0; i < arr.length; i++) {
    await ContactModel.create(arr[i]);
  }

  await cleanIndex("Contact", ContactModel);
  console.log("END CREATE CONTACTS");
})();

(async () => {
  console.log("START DELETE ALL TAGS");
  await TagModel.deleteMany({});
  console.log("END DELETE ALL TAGS");

  console.log("START CREATE TAGS");
  const arr = [
    {
      _id: "621918ea1c78e3bc5df3863c",
      name: "-18",
      __v: 0,
    },
    {
      _id: "621918ea1c78e3bc5df38652",
      name: "Sécurité",
      __v: 0,
    },
    {
      _id: "621918ea1c78e3bc5df38664",
      name: "Paris",
      __v: 0,
    },
    {
      _id: "621918ea1c78e3bc5df38675",
      name: "Deux",
      __v: 0,
    },
    {
      _id: "621c81326efad50ed3232080",
      name: "engagement",
      __v: 0,
    },
    {
      _id: "621c81326efad50ed3232086",
      name: "COHORTE_Février 2022",
      __v: 0,
    },
    {
      _id: "621c81326efad50ed3232089",
      name: "autorité parentale",
      __v: 0,
    },
    {
      _id: "621c81326efad50ed323208c",
      name: "spam",
      __v: 0,
    },
    {
      _id: "621c81326efad50ed323208f",
      name: "adresse postale",
      __v: 0,
    },
    {
      _id: "621c81336efad50ed3232092",
      name: "règlement intérieur",
      __v: 0,
    },
    {
      _id: "621c81336efad50ed3232095",
      name: "phase 0",
      __v: 0,
    },
    {
      _id: "621c81336efad50ed3232098",
      name: "téléversement",
      __v: 0,
    },
    {
      _id: "621c81336efad50ed323209b",
      name: "inscription tardive",
      __v: 0,
    },
    {
      _id: "621c81336efad50ed323209e",
      name: "dérogation",
      __v: 0,
    },
    {
      _id: "621c81336efad50ed32320a1",
      name: "prochaine session",
      __v: 0,
    },
    {
      _id: "621c81336efad50ed32320a4",
      name: "autre",
      __v: 0,
    },
    {
      _id: "621c81336efad50ed32320a7",
      name: "phase 1",
      __v: 0,
    },
    {
      _id: "621c81336efad50ed32320aa",
      name: "lieu affectation",
      __v: 0,
    },
    {
      _id: "621c81336efad50ed32320ad",
      name: "convocation",
      __v: 0,
    },
    {
      _id: "621c81336efad50ed32320b0",
      name: "point de rassemblement",
      __v: 0,
    },
    {
      _id: "621c81336efad50ed32320b3",
      name: "fiche sanitaire",
      __v: 0,
    },
    {
      _id: "621c81336efad50ed32320b6",
      name: "téléchargement",
      __v: 0,
    },
    {
      _id: "621c81336efad50ed32320b9",
      name: "réclamation",
      __v: 0,
    },
    {
      _id: "621c81346efad50ed32320bc",
      name: "liste complémentaire",
      __v: 0,
    },
    {
      _id: "621c81346efad50ed32320bf",
      name: "réaffectation",
      __v: 0,
    },
    {
      _id: "621c81346efad50ed32320c2",
      name: "phase 2",
      __v: 0,
    },
    {
      _id: "621c81346efad50ed32320c5",
      name: "validation référent",
      __v: 0,
    },
    {
      _id: "621c81346efad50ed32320c8",
      name: "visible volontaire",
      __v: 0,
    },
    {
      _id: "621c81346efad50ed32320cb",
      name: "fiche mission",
      __v: 0,
    },
    {
      _id: "621c81346efad50ed32320ce",
      name: "candidature",
      __v: 0,
    },
    {
      _id: "621c81346efad50ed32320d1",
      name: "contrat d'engagement",
      __v: 0,
    },
    {
      _id: "621c81346efad50ed32320d4",
      name: "renvoi du lien",
      __v: 0,
    },
    {
      _id: "621c81346efad50ed32320d7",
      name: "préparation militaire",
      __v: 0,
    },
    {
      _id: "621c81346efad50ed32320da",
      name: "pas de mig",
      __v: 0,
    },
    {
      _id: "621c81346efad50ed32320dd",
      name: "mig par soi-même",
      __v: 0,
    },
    {
      _id: "621c81346efad50ed32320e0",
      name: "phase 3",
      __v: 0,
    },
    {
      _id: "621c81346efad50ed32320e3",
      name: "tek",
      __v: 0,
    },
    {
      _id: "621c81346efad50ed32320e6",
      name: "problème de connexion",
      __v: 0,
    },
    {
      _id: "621c81356efad50ed32320e9",
      name: "bug a qualifier",
      __v: 0,
    },
    {
      _id: "621c81356efad50ed32320ec",
      name: "politique",
      __v: 0,
    },
    {
      _id: "621c81356efad50ed32320ef",
      name: "retex produit",
      __v: 0,
    },
    {
      _id: "621c81356efad50ed32320f2",
      name: "retex projet",
      __v: 0,
    },
    {
      _id: "621c81356efad50ed32320f5",
      name: "en attente SD",
      __v: 0,
    },
    {
      _id: "621c81356efad50ed32320f8",
      name: "en attente tek",
      __v: 0,
    },
    {
      _id: "621c81356efad50ed32320fb",
      name: "animation référent",
      __v: 0,
    },
    {
      _id: "621c81356efad50ed32320fe",
      name: "animation SD",
      __v: 0,
    },
    {
      _id: "621c81356efad50ed3232101",
      name: "animation structure",
      __v: 0,
    },
    {
      _id: "621c81356efad50ed3232104",
      name: "animation chef de centre",
      __v: 0,
    },
    {
      _id: "621c81356efad50ed3232107",
      name: "créer son compte (structure)",
      __v: 0,
    },
    {
      _id: "621c81356efad50ed323210a",
      name: "bug",
      __v: 0,
    },
    {
      _id: "621c81356efad50ed323210d",
      name: "JDC",
      __v: 0,
    },
    {
      _id: "621c81356efad50ed3232110",
      name: "permis",
      __v: 0,
    },
    {
      _id: "621c81356efad50ed3232113",
      name: "AGENT_Référent_Département",
      __v: 0,
    },
    {
      _id: "621c81366efad50ed3232116",
      name: "AGENT_Startup_Technique",
      __v: 0,
    },
    {
      _id: "621c81366efad50ed3232119",
      name: "AGENT_Startup_Support",
      __v: 0,
    },
    {
      _id: "621c81366efad50ed323211c",
      name: "CANAL_Plateforme",
      __v: 0,
    },
    {
      _id: "621c81366efad50ed323211f",
      name: "CANAL_Facebook",
      __v: 0,
    },
    {
      _id: "621c81366efad50ed3232122",
      name: "CANAL_Twitter",
      __v: 0,
    },
    {
      _id: "621c81366efad50ed3232125",
      name: "CANAL_Chat",
      __v: 0,
    },
    {
      _id: "621c81366efad50ed3232128",
      name: "CANAL_Mail",
      __v: 0,
    },
    {
      _id: "621c81366efad50ed323212b",
      name: "EMETTEUR_Volontaire",
      __v: 0,
    },
    {
      _id: "621c81366efad50ed323212e",
      name: "EMETTEUR_Référent",
      __v: 0,
    },
    {
      _id: "621c81366efad50ed3232131",
      name: "PHASE_1",
      __v: 0,
    },
    {
      _id: "621c81366efad50ed3232134",
      name: "PHASE_2",
      __v: 0,
    },
    {
      _id: "621c81366efad50ed3232137",
      name: "PHASE_3",
      __v: 0,
    },
    {
      _id: "621c81366efad50ed323213a",
      name: "COHORTE_2020",
      __v: 0,
    },
    {
      _id: "621c81366efad50ed323213d",
      name: "COHORTE_2021",
      __v: 0,
    },
    {
      _id: "621c81366efad50ed3232140",
      name: "DEPARTEMENT_Finistère",
      __v: 0,
    },
    {
      _id: "621c81376efad50ed3232143",
      name: "DEPARTEMENT_Ain",
      __v: 0,
    },
    {
      _id: "621c81376efad50ed3232146",
      name: "DEPARTEMENT_Aisne",
      __v: 0,
    },
    {
      _id: "621c81376efad50ed3232149",
      name: "DEPARTEMENT_Allier",
      __v: 0,
    },
    {
      _id: "621c81376efad50ed323214c",
      name: "DEPARTEMENT_Alpes-de-Haute-Provence",
      __v: 0,
    },
    {
      _id: "621c81376efad50ed323214f",
      name: "DEPARTEMENT_Hautes-Alpes",
      __v: 0,
    },
    {
      _id: "621c81376efad50ed3232152",
      name: "DEPARTEMENT_Alpes-Maritimes",
      __v: 0,
    },
    {
      _id: "621c81376efad50ed3232155",
      name: "DEPARTEMENT_Ardèche",
      __v: 0,
    },
    {
      _id: "621c81376efad50ed3232158",
      name: "DEPARTEMENT_Ardennes",
      __v: 0,
    },
    {
      _id: "621c81376efad50ed323215b",
      name: "DEPARTEMENT_Ariège",
      __v: 0,
    },
    {
      _id: "621c81376efad50ed323215e",
      name: "DEPARTEMENT_Aube",
      __v: 0,
    },
    {
      _id: "621c81376efad50ed3232161",
      name: "DEPARTEMENT_Aude",
      __v: 0,
    },
    {
      _id: "621c81376efad50ed3232164",
      name: "DEPARTEMENT_Aveyron",
      __v: 0,
    },
    {
      _id: "621c81376efad50ed3232167",
      name: "DEPARTEMENT_Bouches-du-Rhône",
      __v: 0,
    },
    {
      _id: "621c81376efad50ed323216a",
      name: "DEPARTEMENT_Calvados",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed323216d",
      name: "DEPARTEMENT_Cantal",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed3232170",
      name: "DEPARTEMENT_Charente",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed3232173",
      name: "DEPARTEMENT_Charente-Maritime",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed3232176",
      name: "DEPARTEMENT_Cher",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed3232179",
      name: "DEPARTEMENT_Corrèze",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed323217c",
      name: "DEPARTEMENT_Corse",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed323217f",
      name: "DEPARTEMENT_Côte-d'Or",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed3232182",
      name: "DEPARTEMENT_Côtes-d'Armor",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed3232185",
      name: "DEPARTEMENT_Creuse",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed3232188",
      name: "DEPARTEMENT_Dordogne",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed323218b",
      name: "DEPARTEMENT_Doubs",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed323218e",
      name: "DEPARTEMENT_Drôme",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed3232191",
      name: "DEPARTEMENT_Eure",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed3232194",
      name: "DEPARTEMENT_Eure-et-Loir",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed3232197",
      name: "DEPARTEMENT_Corse-du-Sud",
      __v: 0,
    },
    {
      _id: "621c81386efad50ed323219a",
      name: "DEPARTEMENT_Haute-Corse",
      __v: 0,
    },
    {
      _id: "621c81396efad50ed323219d",
      name: "DEPARTEMENT_Gard",
      __v: 0,
    },
    {
      _id: "621c81396efad50ed32321a0",
      name: "DEPARTEMENT_Haute-Garonne",
      __v: 0,
    },
    {
      _id: "621c81396efad50ed32321a3",
      name: "DEPARTEMENT_Gers",
      __v: 0,
    },
    {
      _id: "621c81396efad50ed32321a6",
      name: "DEPARTEMENT_Gironde",
      __v: 0,
    },
    {
      _id: "621c81396efad50ed32321a9",
      name: "DEPARTEMENT_Hérault",
      __v: 0,
    },
    {
      _id: "621c81396efad50ed32321ac",
      name: "DEPARTEMENT_Ille-et-Vilaine",
      __v: 0,
    },
    {
      _id: "621c81396efad50ed32321af",
      name: "DEPARTEMENT_Indre",
      __v: 0,
    },
    {
      _id: "621c81396efad50ed32321b2",
      name: "DEPARTEMENT_Indre-et-Loire",
      __v: 0,
    },
    {
      _id: "621c81396efad50ed32321b5",
      name: "DEPARTEMENT_Isère",
      __v: 0,
    },
    {
      _id: "621c81396efad50ed32321b8",
      name: "DEPARTEMENT_Jura",
      __v: 0,
    },
    {
      _id: "621c81396efad50ed32321bb",
      name: "DEPARTEMENT_Landes",
      __v: 0,
    },
    {
      _id: "621c81396efad50ed32321be",
      name: "DEPARTEMENT_Loir-et-Cher",
      __v: 0,
    },
    {
      _id: "621c81396efad50ed32321c1",
      name: "DEPARTEMENT_Loire",
      __v: 0,
    },
    {
      _id: "621c81396efad50ed32321c4",
      name: "DEPARTEMENT_Haute-Loire",
      __v: 0,
    },
    {
      _id: "621c81396efad50ed32321c7",
      name: "DEPARTEMENT_Loire-Atlantique",
      __v: 0,
    },
    {
      _id: "621c813a6efad50ed32321ca",
      name: "DEPARTEMENT_Loiret",
      __v: 0,
    },
    {
      _id: "621c813a6efad50ed32321cd",
      name: "DEPARTEMENT_Lot",
      __v: 0,
    },
    {
      _id: "621c813a6efad50ed32321d0",
      name: "DEPARTEMENT_Lot-et-Garonne",
      __v: 0,
    },
    {
      _id: "621c813a6efad50ed32321d3",
      name: "DEPARTEMENT_Lozère",
      __v: 0,
    },
    {
      _id: "621c813a6efad50ed32321d6",
      name: "DEPARTEMENT_Maine-et-Loire",
      __v: 0,
    },
    {
      _id: "621c813a6efad50ed32321d9",
      name: "DEPARTEMENT_Manche",
      __v: 0,
    },
    {
      _id: "621c813a6efad50ed32321dc",
      name: "DEPARTEMENT_Marne",
      __v: 0,
    },
    {
      _id: "621c813a6efad50ed32321df",
      name: "DEPARTEMENT_Haute-Marne",
      __v: 0,
    },
    {
      _id: "621c813a6efad50ed32321e2",
      name: "DEPARTEMENT_Mayenne",
      __v: 0,
    },
    {
      _id: "621c813a6efad50ed32321e5",
      name: "DEPARTEMENT_Meurthe-et-Moselle",
      __v: 0,
    },
    {
      _id: "621c813a6efad50ed32321e8",
      name: "DEPARTEMENT_Meuse",
      __v: 0,
    },
    {
      _id: "621c813a6efad50ed32321eb",
      name: "DEPARTEMENT_Morbihan",
      __v: 0,
    },
    {
      _id: "621c813a6efad50ed32321ee",
      name: "DEPARTEMENT_Moselle",
      __v: 0,
    },
    {
      _id: "621c813a6efad50ed32321f1",
      name: "DEPARTEMENT_Nièvre",
      __v: 0,
    },
    {
      _id: "621c813a6efad50ed32321f4",
      name: "DEPARTEMENT_Nord",
      __v: 0,
    },
    {
      _id: "621c813b6efad50ed32321f7",
      name: "DEPARTEMENT_Oise",
      __v: 0,
    },
    {
      _id: "621c813b6efad50ed32321fa",
      name: "DEPARTEMENT_Orne",
      __v: 0,
    },
    {
      _id: "621c813b6efad50ed32321fd",
      name: "DEPARTEMENT_Pas-de-Calais",
      __v: 0,
    },
    {
      _id: "621c813b6efad50ed3232200",
      name: "DEPARTEMENT_Puy-de-Dôme",
      __v: 0,
    },
    {
      _id: "621c813b6efad50ed3232203",
      name: "DEPARTEMENT_Pyrénées-Atlantiques",
      __v: 0,
    },
    {
      _id: "621c813b6efad50ed3232206",
      name: "DEPARTEMENT_Hautes-Pyrénées",
      __v: 0,
    },
    {
      _id: "621c813b6efad50ed3232209",
      name: "DEPARTEMENT_Pyrénées-Orientales",
      __v: 0,
    },
    {
      _id: "621c813b6efad50ed323220c",
      name: "DEPARTEMENT_Bas-Rhin",
      __v: 0,
    },
    {
      _id: "621c813b6efad50ed323220f",
      name: "DEPARTEMENT_Haut-Rhin",
      __v: 0,
    },
    {
      _id: "621c813b6efad50ed3232212",
      name: "DEPARTEMENT_Rhône",
      __v: 0,
    },
    {
      _id: "621c813b6efad50ed3232215",
      name: "DEPARTEMENT_Haute-Saône",
      __v: 0,
    },
    {
      _id: "621c813b6efad50ed3232218",
      name: "DEPARTEMENT_Saône-et-Loire",
      __v: 0,
    },
    {
      _id: "621c813b6efad50ed323221b",
      name: "DEPARTEMENT_Sarthe",
      __v: 0,
    },
    {
      _id: "621c813b6efad50ed323221e",
      name: "DEPARTEMENT_Savoie",
      __v: 0,
    },
    {
      _id: "621c813b6efad50ed3232221",
      name: "DEPARTEMENT_Haute-Savoie",
      __v: 0,
    },
    {
      _id: "621c813c6efad50ed3232224",
      name: "DEPARTEMENT_Paris",
      __v: 0,
    },
    {
      _id: "621c813c6efad50ed3232227",
      name: "DEPARTEMENT_Seine-Maritime",
      __v: 0,
    },
    {
      _id: "621c813c6efad50ed323222a",
      name: "DEPARTEMENT_Seine-et-Marne",
      __v: 0,
    },
    {
      _id: "621c813c6efad50ed323222d",
      name: "DEPARTEMENT_Yvelines",
      __v: 0,
    },
    {
      _id: "621c813c6efad50ed3232230",
      name: "DEPARTEMENT_Deux-Sèvres",
      __v: 0,
    },
    {
      _id: "621c813c6efad50ed3232233",
      name: "DEPARTEMENT_Somme",
      __v: 0,
    },
    {
      _id: "621c813c6efad50ed3232236",
      name: "DEPARTEMENT_Tarn",
      __v: 0,
    },
    {
      _id: "621c813c6efad50ed3232239",
      name: "DEPARTEMENT_Tarn-et-Garonne",
      __v: 0,
    },
    {
      _id: "621c813c6efad50ed323223c",
      name: "DEPARTEMENT_Var",
      __v: 0,
    },
    {
      _id: "621c813c6efad50ed323223f",
      name: "DEPARTEMENT_Vaucluse",
      __v: 0,
    },
    {
      _id: "621c813c6efad50ed3232242",
      name: "DEPARTEMENT_Vendée",
      __v: 0,
    },
    {
      _id: "621c813c6efad50ed3232245",
      name: "DEPARTEMENT_Vienne",
      __v: 0,
    },
    {
      _id: "621c813c6efad50ed3232248",
      name: "DEPARTEMENT_Haute-Vienne",
      __v: 0,
    },
    {
      _id: "621c813c6efad50ed323224b",
      name: "DEPARTEMENT_Vosges",
      __v: 0,
    },
    {
      _id: "621c813c6efad50ed323224e",
      name: "DEPARTEMENT_Yonne",
      __v: 0,
    },
    {
      _id: "621c813d6efad50ed3232251",
      name: "DEPARTEMENT_Territoire de Belfort",
      __v: 0,
    },
    {
      _id: "621c813d6efad50ed3232254",
      name: "DEPARTEMENT_Essonne",
      __v: 0,
    },
    {
      _id: "621c813d6efad50ed3232257",
      name: "DEPARTEMENT_Hauts-de-Seine",
      __v: 0,
    },
    {
      _id: "621c813d6efad50ed323225a",
      name: "DEPARTEMENT_Seine-Saint-Denis",
      __v: 0,
    },
    {
      _id: "621c813d6efad50ed323225d",
      name: "DEPARTEMENT_Val-de-Marne",
      __v: 0,
    },
    {
      _id: "621c813d6efad50ed3232260",
      name: "DEPARTEMENT_Val-d'Oise",
      __v: 0,
    },
    {
      _id: "621c813d6efad50ed3232263",
      name: "DEPARTEMENT_Guadeloupe",
      __v: 0,
    },
    {
      _id: "621c813d6efad50ed3232266",
      name: "DEPARTEMENT_Martinique",
      __v: 0,
    },
    {
      _id: "621c813d6efad50ed3232269",
      name: "DEPARTEMENT_Guyane",
      __v: 0,
    },
    {
      _id: "621c813d6efad50ed323226c",
      name: "DEPARTEMENT_La Réunion",
      __v: 0,
    },
    {
      _id: "621c813d6efad50ed323226f",
      name: "DEPARTEMENT_Saint-Pierre-et-Miquelon",
      __v: 0,
    },
    {
      _id: "621c813d6efad50ed3232272",
      name: "DEPARTEMENT_Mayotte",
      __v: 0,
    },
    {
      _id: "621c813d6efad50ed3232275",
      name: "DEPARTEMENT_Saint-Martin",
      __v: 0,
    },
    {
      _id: "621c813d6efad50ed3232278",
      name: "DEPARTEMENT_Polynésie française",
      __v: 0,
    },
    {
      _id: "621c813d6efad50ed323227b",
      name: "DEPARTEMENT_Nouvelle-Calédonie",
      __v: 0,
    },
    {
      _id: "621c813e6efad50ed323227e",
      name: "REGION_Auvergne-Rhône-Alpes",
      __v: 0,
    },
    {
      _id: "621c813e6efad50ed3232281",
      name: "REGION_Bourgogne-Franche-Comté",
      __v: 0,
    },
    {
      _id: "621c813e6efad50ed3232284",
      name: "REGION_Bretagne",
      __v: 0,
    },
    {
      _id: "621c813e6efad50ed3232287",
      name: "REGION_Centre-Val de Loire",
      __v: 0,
    },
    {
      _id: "621c813e6efad50ed323228a",
      name: "REGION_Corse",
      __v: 0,
    },
    {
      _id: "621c813e6efad50ed323228d",
      name: "REGION_Grand Est",
      __v: 0,
    },
    {
      _id: "621c813e6efad50ed3232290",
      name: "REGION_Hauts-de-France",
      __v: 0,
    },
    {
      _id: "621c813e6efad50ed3232293",
      name: "REGION_Île-de-France",
      __v: 0,
    },
    {
      _id: "621c813e6efad50ed3232296",
      name: "REGION_Normandie",
      __v: 0,
    },
    {
      _id: "621c813e6efad50ed3232299",
      name: "REGION_Nouvelle-Aquitaine",
      __v: 0,
    },
    {
      _id: "621c813e6efad50ed323229c",
      name: "REGION_Occitanie",
      __v: 0,
    },
    {
      _id: "621c813e6efad50ed323229f",
      name: "REGION_Pays de la Loire",
      __v: 0,
    },
    {
      _id: "621c813e6efad50ed32322a2",
      name: "REGION_Provence-Alpes-Côte d'Azur",
      __v: 0,
    },
    {
      _id: "621c813e6efad50ed32322a5",
      name: "REGION_Guadeloupe",
      __v: 0,
    },
    {
      _id: "621c813e6efad50ed32322a8",
      name: "REGION_Martinique",
      __v: 0,
    },
    {
      _id: "621c813f6efad50ed32322ab",
      name: "REGION_Guyane",
      __v: 0,
    },
    {
      _id: "621c813f6efad50ed32322ae",
      name: "REGION_La Réunion",
      __v: 0,
    },
    {
      _id: "621c813f6efad50ed32322b1",
      name: "REGION_Saint-Pierre-et-Miquelon",
      __v: 0,
    },
    {
      _id: "621c813f6efad50ed32322b4",
      name: "REGION_Mayotte",
      __v: 0,
    },
    {
      _id: "621c813f6efad50ed32322b7",
      name: "REGION_Saint-Barthélemy",
      __v: 0,
    },
    {
      _id: "621c813f6efad50ed32322ba",
      name: "REGION_Saint-Martin",
      __v: 0,
    },
    {
      _id: "621c813f6efad50ed32322bd",
      name: "REGION_Terres australes et antarctiques françaises",
      __v: 0,
    },
    {
      _id: "621c813f6efad50ed32322c0",
      name: "REGION_Wallis-et-Futuna",
      __v: 0,
    },
    {
      _id: "621c813f6efad50ed32322c3",
      name: "REGION_Polynésie française",
      __v: 0,
    },
    {
      _id: "621c813f6efad50ed32322c6",
      name: "TAG_probleme_connexion",
      __v: 0,
    },
    {
      _id: "621c813f6efad50ed32322c9",
      name: "COHORTE_2019",
      __v: 0,
    },
    {
      _id: "621c813f6efad50ed32322cc",
      name: "TAG_phase_0",
      __v: 0,
    },
    {
      _id: "621c813f6efad50ed32322cf",
      name: "EMETTEUR_Structure",
      __v: 0,
    },
    {
      _id: "621c813f6efad50ed32322d2",
      name: "fonction",
      __v: 0,
    },
    {
      _id: "621c813f6efad50ed32322d5",
      name: "osmose",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed32322d8",
      name: "vu",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed32322db",
      name: "DEPARTEMENT_",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed32322de",
      name: "REGION_",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed32322e1",
      name: "pb mail",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed32322e4",
      name: "recrutement",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed32322e7",
      name: "supression compte",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed32322ea",
      name: "EMETTEUR_Admin",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed32322ed",
      name: "TAG_problème_technique",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed32322f0",
      name: "TAG_téléversement",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed32322f3",
      name: "TAG_question",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed32322f6",
      name: "TAG_autre",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed32322f9",
      name: "AGENT_STARTUP_Support",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed32322fc",
      name: "TAG_téléchargment",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed32322ff",
      name: "TAG_phase_2",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed3232302",
      name: "TAG_phase_3",
      __v: 0,
    },
    {
      _id: "621c81406efad50ed3232305",
      name: "communication",
      __v: 0,
    },
    {
      _id: "621c81416efad50ed3232308",
      name: "AGENT_Référent_Région",
      __v: 0,
    },
    {
      _id: "621c81416efad50ed323230b",
      name: "TAG_Cas_particulier",
      __v: 0,
    },
    {
      _id: "621c81416efad50ed323230e",
      name: "TAG_contrat_engagement",
      __v: 0,
    },
    {
      _id: "621c81416efad50ed3232311",
      name: "permanence",
      __v: 0,
    },
    {
      _id: "621c81416efad50ed3232314",
      name: "TAG_phase_1",
      __v: 0,
    },
    {
      _id: "621c81416efad50ed3232317",
      name: "TAG_Question",
      __v: 0,
    },
    {
      _id: "621c81416efad50ed323231a",
      name: "TAG_Accueil",
      __v: 0,
    },
    {
      _id: "621c81416efad50ed323231d",
      name: "TAG_Autre Demande",
      __v: 0,
    },
    {
      _id: "621c81416efad50ed3232320",
      name: "boîte de reception",
      __v: 0,
    },
    {
      _id: "621c81416efad50ed3232323",
      name: "page blanche",
      __v: 0,
    },
    {
      _id: "621c81416efad50ed3232326",
      name: "annuaire association",
      __v: 0,
    },
    {
      _id: "621c81416efad50ed3232329",
      name: "pix",
      __v: 0,
    },
    {
      _id: "621c81416efad50ed323232c",
      name: "18 ans",
      __v: 0,
    },
    {
      _id: "621c81416efad50ed323232f",
      name: "onboarding",
      __v: 0,
    },
    {
      _id: "621c81426efad50ed3232332",
      name: "pare-feu",
      __v: 0,
    },
    {
      _id: "621c81426efad50ed3232335",
      name: "COHORTE_2022",
      __v: 0,
    },
    {
      _id: "621c81426efad50ed3232338",
      name: "bug_2nde",
      __v: 0,
    },
    {
      _id: "621c81426efad50ed323233b",
      name: "merci",
      __v: 0,
    },
    {
      _id: "621c81426efad50ed323233e",
      name: "TAG_Candidature",
      __v: 0,
    },
    {
      _id: "621c81426efad50ed3232341",
      name: "nationalité",
      __v: 0,
    },
    {
      _id: "621c81426efad50ed3232344",
      name: "TAG_Fiche_mission",
      __v: 0,
    },
    {
      _id: "621c81426efad50ed3232347",
      name: "état civil",
      __v: 0,
    },
    {
      _id: "621c81426efad50ed323234a",
      name: "mécontent",
      __v: 0,
    },
    {
      _id: "621c81426efad50ed323234d",
      name: "jsp",
      __v: 0,
    },
    {
      _id: "621c81426efad50ed3232350",
      name: "WOW",
      __v: 0,
    },
    {
      _id: "621c81426efad50ed3232353",
      name: "inscription",
      __v: 0,
    },
    {
      _id: "621c81426efad50ed3232356",
      name: "réinscription",
      __v: 0,
    },
    {
      _id: "621c81426efad50ed3232359",
      name: "COHORTE_Juillet 2022",
      __v: 0,
    },
    {
      _id: "621c81426efad50ed323235c",
      name: "DEPARTEMENT_undefined",
      __v: 0,
    },
    {
      _id: "621c81436efad50ed323235f",
      name: "REGION_undefined",
      __v: 0,
    },
    {
      _id: "621c81436efad50ed3232362",
      name: "CANAL_Formulaire",
      __v: 0,
    },
    {
      _id: "621c81436efad50ed3232365",
      name: "EMETTEUR_Exterieur",
      __v: 0,
    },
    {
      _id: "621c81436efad50ed3232368",
      name: "COHORTE_Juin 2022",
      __v: 0,
    },
    {
      _id: "621c81436efad50ed323236b",
      name: "éligibilité",
      __v: 0,
    },
    {
      _id: "621c81436efad50ed323236e",
      name: "jeunes",
      __v: 0,
    },
    {
      _id: "621c81436efad50ed3232371",
      name: "uniforme",
      __v: 0,
    },
    {
      _id: "621c81436efad50ed3232374",
      name: "identifiant",
      __v: 0,
    },
    {
      _id: "621c81436efad50ed3232377",
      name: "TAG_créer_compte_structure",
      __v: 0,
    },
    {
      _id: "621c81436efad50ed323237a",
      name: "bug_plateforme",
      __v: 0,
    },
    {
      _id: "621c81436efad50ed323237d",
      name: "etablissement",
      __v: 0,
    },
    {
      _id: "621c81436efad50ed3232380",
      name: "vaccination",
      __v: 0,
    },
    {
      _id: "621c81436efad50ed3232383",
      name: "handicap",
      __v: 0,
    },
    {
      _id: "621c81436efad50ed3232386",
      name: "bug_pièces",
      __v: 0,
    },
    {
      _id: "621c81436efad50ed3232389",
      name: "désistement",
      __v: 0,
    },
    {
      _id: "621c81446efad50ed323238c",
      name: "bug_annuaire",
      __v: 0,
    },
    {
      _id: "621c81446efad50ed323238f",
      name: "bug_tableau de bord",
      __v: 0,
    },
    {
      _id: "621c81446efad50ed3232392",
      name: "archive",
      __v: 0,
    },
    {
      _id: "621c81446efad50ed3232395",
      name: "changement séjour",
      __v: 0,
    },
    {
      _id: "621c81446efad50ed3232398",
      name: "EMETTEUR_Visiteur_Régional",
      __v: 0,
    },
    {
      _id: "621c81446efad50ed323239b",
      name: "binôme",
      __v: 0,
    },
    {
      _id: "621c81446efad50ed323239e",
      name: "photo",
      __v: 0,
    },
    {
      _id: "621c81446efad50ed32323a1",
      name: "trousseau",
      __v: 0,
    },
    {
      _id: "621c81446efad50ed32323a4",
      name: "attestation",
      __v: 0,
    },
    {
      _id: "621c81446efad50ed32323a7",
      name: "séjour",
      __v: 0,
    },
    {
      _id: "621c81446efad50ed32323aa",
      name: "bug_export",
      __v: 0,
    },
    {
      _id: "621c81446efad50ed32323ad",
      name: "bug_chef-de-centre",
      __v: 0,
    },
    {
      _id: "621c81446efad50ed32323b0",
      name: "export",
      __v: 0,
    },
    {
      _id: "621c81446efad50ed32323b3",
      name: "devoir",
      __v: 0,
    },
    {
      _id: "621c81456efad50ed32323b6",
      name: "encadrant",
      __v: 0,
    },
    {
      _id: "621c81456efad50ed32323b9",
      name: "pièces d'identité",
      __v: 0,
    },
    {
      _id: "621c81456efad50ed32323bc",
      name: "statuts",
      __v: 0,
    },
    {
      _id: "621c81456efad50ed32323bf",
      name: "COVIDFEV",
      __v: 0,
    },
    {
      _id: "621c81456efad50ed32323c2",
      name: "mot de passe",
      __v: 0,
    },
    {
      _id: "621c81456efad50ed32323c5",
      name: "espace chef de centre",
      __v: 0,
    },
    {
      _id: "621c81456efad50ed32323c8",
      name: "transport",
      __v: 0,
    },
    {
      _id: "621c81456efad50ed32323cb",
      name: "bug_etablissement",
      __v: 0,
    },
    {
      _id: "621c81456efad50ed32323ce",
      name: "contact référent",
      __v: 0,
    },
    {
      _id: "621c81456efad50ed32323d1",
      name: "statut MIG",
      __v: 0,
    },
    {
      _id: "621c81456efad50ed32323d4",
      name: "réinscription ok",
      __v: 0,
    },
    {
      _id: "621c81456efad50ed32323d7",
      name: "protocole sanitaire",
      __v: 0,
    },
    {
      _id: "621c81456efad50ed32323da",
      name: "BAFA",
      __v: 0,
    },
    {
      _id: "621c81456efad50ed32323dd",
      name: "mig",
      __v: 0,
    },
    {
      _id: "621c81456efad50ed32323e0",
      name: "étranger",
      __v: 0,
    },
    {
      _id: "621c81466efad50ed32323e3",
      name: "webinaire",
      __v: 0,
    },
    {
      _id: "621c81466efad50ed32323e6",
      name: "Absfevreport",
      __v: 0,
    },
    {
      _id: "621c81466efad50ed32323e9",
      name: "CAP",
      __v: 0,
    },
    {
      _id: "621c81466efad50ed32323ec",
      name: "bug_departement",
      __v: 0,
    },
    {
      _id: "621c81466efad50ed32323ef",
      name: "MIG",
      __v: 0,
    },
    {
      _id: "621c81466efad50ed32323f2",
      name: "cohorte 2020",
      __v: 0,
    },
    {
      _id: "621c81466efad50ed32323f5",
      name: "agent",
      __v: 0,
    },
  ];

  for (el of arr) {
    await TagModel.create({ name: el.name });
  }

  await cleanIndex("tag", TagModel);
  console.log("END CREATE TAGS");
})();

(async () => {
  console.log("START DELETE ALL SHORTCUTS");
  await ShortcutModel.deleteMany({});
  console.log("END DELETE ALL SHORTCUTS");

  console.log("START CREATE SHORTCUTS");
  const arr = [
    {
      _id: "621918ea1c78e3bc5df3863a",
      name: "bj",
      text: "Bonjour",
      __v: 0,
    },
    {
      _id: "621918ea1c78e3bc5df38646",
      name: "mail",
      text: "Merci de contacter contact@selego.co",
      __v: 0,
    },
    {
      _id: "621918ea1c78e3bc5df38654",
      name: "slg",
      text: "Selego",
      __v: 0,
    },
    {
      _id: "621918ea1c78e3bc5df38666",
      name: "ar",
      text: "Au revoir",
      __v: 0,
    },
    {
      _id: "621bc0ea46aa021b0320e24e",
      name: "engagement",
      text: 'Si l\'engagement vous intéresse, vous pouvez également prendre contact avec ces structures : <div><ul>\n<li> la plateforme JeVeuxAider.gouv.fr de la Réserve Civique pour participer à des mission ponctuelles ou régulières, "à la carte" &gt; <a href="https://www.jeveuxaider.gouv.fr/" rel="nofollow noreferrer noopener" target="_blank">https://www.jeveuxaider.gouv.fr/</a> </li>\n<li> le Service Civique pour un engagement de 6 mois minimum au sein d\'une structure d\'accueil, moyennant une indemnisation financière &gt; <a href="https://www.service-civique.gouv.fr/" rel="nofollow noreferrer noopener" target="_blank">https://www.service-civique.gouv.fr/</a> </li>\n<li>participer à une préparation militaire proposée par les Armées, en se rapprochant du CIRFA le plus proche de chez vous &gt; <a href="https://www.sengager.fr/ou-nous-rencontrer" rel="nofollow noreferrer noopener" target="_blank">https://www.sengager.fr/ou-nous-rencontrer</a> </li>\n<li>devenir sapeurs pompiers volontaires &gt; <a href="https://www.pompiers.fr/grand-public/devenir-sapeur-pompier/devenir-sapeur-pompier-volontaire-spv" rel="nofollow noreferrer noopener" target="_blank">https://www.pompiers.fr/grand-public/devenir-sapeur-pompier/devenir-sapeur-pompier-volontaire-spv</a> </li>\n<li> s\'engager comme Réserviste dans la Gendarmerie Nationale &gt; <a href="https://www.lagendarmerierecrute.fr/carrieres/carriere-operationnelle/reserviste" rel="nofollow noreferrer noopener" target="_blank">https://www.lagendarmerierecrute.fr/carrieres/carriere-operationnelle/reserviste</a> </li>\n<li>devenir réserviste dans une Armée  &gt; <a href="https://www.defense.gouv.fr/reserve/devenir-reserviste" rel="nofollow noreferrer noopener" target="_blank">https://www.defense.gouv.fr/reserve/devenir-reserviste</a>\n</li>\n</ul></div>',
      __v: 0,
    },
    {
      _id: "621bc0eb46aa021b0320e254",
      name: "connaissance",
      text: '<div><a href="https://support.snu.gouv.fr/base-de-connaissance" title="https://support.snu.gouv.fr/base-de-connaissance" rel="nofollow noreferrer noopener" target="_blank">https://support.snu.gouv.fr/base-de-connaissance</a></div>',
      __v: 0,
    },
    {
      _id: "621bc0eb46aa021b0320e257",
      name: "autorité parentale",
      text: "<div>Bonjour,</div><div><br></div><div>L’inscription au SNU relève des actes usuels de la vie quotidienne. L’inscription d’un seul parent peut suffire, ce parent étant réputé agir avec l’accord de l’autre parent.<u></u><u></u>\n</div><div>En revanche, le formulaire de consentement relatif au droit à l’image est à signer par les deux parents.</div><div><br></div><div>Bien à vous</div>",
      __v: 0,
    },
    {
      _id: "621bc0eb46aa021b0320e25a",
      name: "admin (lien)",
      text: '<div><a href="https://admin.snu.gouv.fr" rel="nofollow noreferrer noopener" target="_blank">https://admin.snu.gouv.fr</a>\n</div>',
      __v: 0,
    },
    {
      _id: "621bc0eb46aa021b0320e25d",
      name: "mon compte (lien)",
      text: '<div><a href="https://moncompte.snu.gouv.fr/" title="https://moncompte.snu.gouv.fr/" rel="nofollow noreferrer noopener" target="_blank">https://moncompte.snu.gouv.fr/</a></div>',
      __v: 0,
    },
    {
      _id: "621bc0eb46aa021b0320e260",
      name: "état_civil",
      text: "<div>Je vous confirme la modification apportée ce jour au dossier de : </div><div> , votre attestation est disponible au téléchargement depuis votre espace volontaire. </div><div><br></div><div>En copie de ce mail en tant que <b>référents</b>  : </div><div><br></div><div>je vous informe de la modification du dossier de la / du volontaire <span>sur la plateforme SNU. Celui-ci aura un impact sur le classement (alphabétique) des dossiers. </span>\n</div><div><br></div><div>Nous restons disponibles pour toute information complémentaire, </div>",
      __v: 0,
    },
    {
      _id: "621bc0eb46aa021b0320e263",
      name: "identifiant(admin)",
      text: 'Bonjour, <div>Votre identifiant est bien : <br>Pour réinitialiser votre mot de passe, nous vous invitons à vous connecter sur le lien : <a href="https://admin.snu.gouv.fr" rel="nofollow noreferrer noopener" target="_blank">https://admin.snu.gouv.fr</a> puis de cliquer sur le texte : Mot de passe perdu ? . Il vous suffit ensuite simplement de suivre les étapes de réinitialisation. </div><div><br></div><div>Bien à vous, </div>',
      __v: 0,
    },
    {
      _id: "621bc0eb46aa021b0320e266",
      name: "réinscription",
      text: '<div>Bonjour <span>#{ticket.customer.firstname}</span><span> , </span>\n</div><div>Nous sommes ravis de voir votre enthousiasme à participer à un séjour de cohésion, pour vous réinscrire, merci de suivre les étapes ci-dessous : <div>En 2021, vous avez déjà rempli un dossier d\'inscription. Avant de vous lancer dans les démarches de réinscription, merci de vérifier que vous êtes éligible à l\'un des séjours de 2022 : <a href="https://support.snu.gouv.fr/base-de-connaissance/suis-je-eligible-a-un-sejour-de-cohesion-en-2022-1" rel="nofollow noreferrer noopener" title="https://support.snu.gouv.fr/base-de-connaissance/suis-je-eligible-a-un-sejour-de-cohesion-en-2022-1" target="_blank">Comment savoir si je suis éligible aux séjours de cohésion 2022 ?</a>\n</div>\n<div><br></div>\n<div>\n<ol></ol>\n<div>\n<h2>Liste complémentaire et Non réalisée <br>\n</h2>\n<div><br></div>\n<div>\n<div>\n<span style="color: rgb(69, 74, 79);">Comment me réinscrire en 2022 ? </span><br>\n</div>\n<div><div>\n<b> Envoyer un mail :</b><br>\n</div></div>\n</div>\n<div>A l\'adresse : <a href="mailto:contact@mail-support.snu.gouv.fr?subject=%5BINSCRIPTION%5D%20Me%20r%C3%A9inscrire%20-%20Non%20r%C3%A9alis%C3%A9&amp;body=Bonjour,%0D%0Aen%202021%20je%20n%27ai%20pas%20pu%20participer%20au%20s%C3%A9jour%20de%20coh%C3%A9sion,%20et%20je%20souhaite%20me%20r%C3%A9inscrire%20en%202022.%20Voici%20mes%20informations:%0D%0A-Mon%20pr%C3%A9nom:%0D%0A-Mon%20nom%20de%20famille:%0D%0A-Ma%20date%20de%20naissance(jour,mois,ann%C3%A9e):%0D%0A-Mon%20lieu%20de%20naissance:%0D%0A-Mon%20niveau%20scolaire%20actuel%20(classe):%0D%0A-Mon%20code%20postal%20de%20r%C3%A9sidence%20(adresse):%0D%0AMerci%20d%27avance%20de%20la%20r%C3%A9ponse%20que%20vous%20pourrez%20m%27apporter.">contact@mail-support.snu.gouv.fr</a> en précisant l\'objet :  [INSCRIPTION] Me réinscrire - Non réalisé <span>et en indiquant les informations ci-dessous : </span>\n</div>\n<div>\n<ul>\n<li>Mon prénom : </li>\n<li>Mon nom : </li>\n<li>Ma date de naissance (jour, mois et année) : </li>\n<li>Mon lieu de naissance :</li>\n<li>Mon niveau scolaire actuel (classe) : </li>\n<li>Mon code postal de résidence : </li>\n</ul>\n<div>\n<b>⚠️IMPORTANT :</b> ces informations sont indispensables pour le traitement de votre dossier. <br>\n</div>\n<div><br></div>\n<div><b>Ajouter les documents ci-dessous : </b></div>\n</div>\n<div><div>\n<ul>\n<li>Téléchargez le modèle et complétez le document de : <a href="https://cni-bucket-prod.cellar-c2.services.clever-cloud.com/file/Consentement_du_representant_legal_2022.pdf" rel="nofollow noreferrer noopener" title="https://cni-bucket-prod.cellar-c2.services.clever-cloud.com/file/Consentement_du_representant_legal_2022.pdf" target="_blank">Consentement du ou des représentants légaux </a>\n</li>\n<li>Scan / photo de votre pièce d\'identité :  Carte nationale d\'identité RECTO-VERSO ou passeport dans un format lisible . </li>\n</ul>\n<div>Si votre dossier est validé, <a href="https://moncompte.snu.gouv.fr/" rel="nofollow noreferrer noopener" title="https://moncompte.snu.gouv.fr/" target="_blank">votre espace volontaire</a> sera actualisé avec le statut : Validée. Si tel n\'est pas le cas, notre équipe reviendra vers vous. </div>\n</div></div>\n<div><div><br></div></div>\n<div>Nous restons disponibles pour toute information complémentaire, </div>\n</div>\n</div>\n</div>',
      __v: 0,
    },
    {
      _id: "621bc0eb46aa021b0320e269",
      name: "support en vacances",
      text: 'Ceci est un mail automatique, merci de ne pas y répondre. \n \nBonjour, \n\nNous avons bien reçu votre demande. En cette période estivale , les temps de traitement des demandes sont un peu plus longs que d\'habitude. ☀️\nPour plus de rapidité, nous vous invitons à consulter les liens ci-dessous : \n1/ Consultez notre centre d\'aide : <a href="https://support.snu.gouv.fr/base-de-connaissance" rel="nofollow noreferrer noopener" target="_blank">https://support.snu.gouv.fr/base-de-connaissance</a> \n2/ Consultez notre FAQ (Foire aux questions) : <a href="https://www.snu.gouv.fr/foire-aux-questions-11" rel="nofollow noreferrer noopener" target="_blank">https://www.snu.gouv.fr/foire-aux-questions-11</a> \nNous serons bientôt de retour, \nBelle journée, \nL\'équipe support du SNU',
      __v: 0,
    },
    {
      _id: "621bc0eb46aa021b0320e26c",
      name: "reception mail",
      text: "<i>Pour vous assurer de bien recevoir les communications de la plateforme, pensez à vérifier que les mails de la plateforme ne se glissent pas dans vos spams / courriers indésirables , ou tout autre dossier (ex  Promotions ou réseaux sociaux). Si nécessaire ajoutez l'expéditeur à votre carnet de contact ou déplacer le mail dans votre boîte de réception. </i>",
      __v: 0,
    },
    {
      _id: "621bc0eb46aa021b0320e26f",
      name: "changement séjour (précision)",
      text: "Bonjour \n\n<span>#{ticket.customer.firstname}</span> , <div>Il est tout à fait possible de modifier votre séjour, pourriez-vous m'indiquer sur quel séjour vous souhaitez vous réinscrire ? </div><div>Attention ce changement ne peut être réalisé qu'une seule fois. </div><div>Voici les dates des prochains séjours : </div><div>- juin : 12 au 24 juin 2022 </div><div>- juillet : 3 au 15 juillet 2022</div><div><br></div><div>Merci d'avance pour votre retour, </div><div>Bien à vous, </div><div><div data-signature-id=\"2\">\n<span>#{user.firstname} </span>pour l'équipe support SNU<div>snu.gouv.fr </div>\n</div></div>",
      __v: 0,
    },
    {
      _id: "621bc0eb46aa021b0320e272",
      name: "changement séjour OK",
      text: "Bonjour, <div>Je viens d'apporter la modification à votre espace volontaire. </div><div>Vous êtes donc inscrite sur le séjour de : [DATE]</div><div>Attention nous ne pourrons pas revenir en arrière , ni modifier à nouveau vos dates de séjour. </div><div>Merci de votre compréhension. </div><div><br></div><div>Nous restons disponibles pour toute information complémentaire et vous souhaitons un bon séjour de cohésion ! </div><div>Bien à vous, </div><div>\n<span>#{user.firstname}</span> pour l'équipe support SNU</div>",
      __v: 0,
    },
    {
      _id: "621bc0eb46aa021b0320e275",
      name: "Candidature Encadrant",
      text: "Bonjour,<div>\n<br><div>Nous vous remercions de l'intérêt que vous portez au SNU . </div>\n<div>Les candidatures pour devenir encadrant(e) sont à adresser au chef de projet de votre département. Je peux vous transmettre ses coordonnées. Pour cela pouvez-vous m'indiquer dans quel département vous vous situez ? </div>\n<div><br></div>\n<div>Merci d'avance pour votre retour, </div>\n<div>Bien à vous, <br><div data-signature-id=\"2\"><br></div>\n</div>\n</div>",
      __v: 0,
    },
    {
      _id: "621bc0eb46aa021b0320e278",
      name: "MaJ - navigateur",
      text: '<div>Pour connaître les démarches de mises à jour, cliquez sur le lien de votre navigateur : </div><div><ul>\n<li>chrome: <a href="https://support.google.com/chrome/answer/95414?hl=fr&amp;co=GENIE.Platform%3DDesktop" rel="nofollow noreferrer noopener" target="_blank">https://support.google.com/chrome/answer/95414?hl=fr&amp;co=GENIE.Platform%3DDesktop</a> , <br>\n</li>\n<li>firefox : <a href="https://support.mozilla.org/fr/kb/mettre-jour-firefox-derniere-version" rel="nofollow noreferrer noopener" target="_blank">https://support.mozilla.org/fr/kb/mettre-jour-firefox-derniere-version</a>\n</li>\n<li>internet explorer/edge :<a href="https://support.microsoft.com/fr-fr/topic/param%C3%A8tres-de-mise-%C3%A0-jour-de-microsoft-edge-af8aaca2-1b69-4870-94fe-18822dbb7ef1#:~:text=Dans%20le%20navigateur%2C%20allez%20%C3%A0%20Param%C3%A8tres%20et%20plus%20%3E%20%C3%A0%20propos,automatiquement%20les%20mises%20%C3%A0%20jour" rel="nofollow noreferrer noopener" target="_blank">https://support.microsoft.com/fr-fr/topic/param%C3%A8tres-de-mise-%C3%A0-jour-de-microsoft-edge-af8aaca2-1b69-4870-94fe-18822dbb7ef1#:~:text=Dans%20le%20navigateur%2C%20allez%20%C3%A0%20Param%C3%A8tres%20et%20plus%20%3E%20%C3%A0%20propos,automatiquement%20les%20mises%20%C3%A0%20jour</a>\n</li>\n</ul></div>',
      __v: 0,
    },
    {
      _id: "621bc0eb46aa021b0320e27b",
      name: "JDC (lien article)",
      text: '<div><a href="https://support.snu.gouv.fr/base-de-connaissance/journee-defense-et-citoyennete-1" title="https://support.snu.gouv.fr/base-de-connaissance/journee-defense-et-citoyennete-1" rel="nofollow noreferrer noopener" target="_blank">https://support.snu.gouv.fr/base-de-connaissance/journee-defense-et-citoyennete-1</a></div>',
      __v: 0,
    },
    {
      _id: "621bc0ec46aa021b0320e27e",
      name: "Voile religion",
      text: '<span style="color:rgb(29, 28, 29);">Bonjour,</span><div><span style="color:rgb(29, 28, 29);"><br></span></div><div>\n<span style="color:rgb(29, 28, 29);"></span><span style="color:rgb(29, 28, 29);">La participation au SNU est ouverte à tous les jeunes de 15 à 17 ans, de nationalité française, quelle que soit leur culture ou leur religion.</span>\n</div><div>\n<br><span style="color:rgb(29, 28, 29);">L’objectif fondamental du séjour de cohésion, phase 1 du parcours d’engagement de chaque volontaire, est la cohésion : c’est pourquoi, le principe de laïcité est rappelé dans le règlement intérieur auquel chaque volontaire est tenu d’adhérer au moment de son inscription.</span><span style="color:rgb(29, 28, 29);"></span><span style="color:rgb(29, 28, 29);">Ce règlement prévoit : « Les signes et manifestations d’appartenance religieuse des cadres, intervenants et personnels sont rigoureusement proscrits au sein du centre SNU et au cours des activités.</span><br><span style="color:rgb(29, 28, 29);"><br></span>\n</div><div><span style="color:rgb(29, 28, 29);">De la même façon, il est interdit aux volontaires de porter tout signe ostensible d’appartenance religieuse au sein des centres SNU, à l’exclusion des espaces privés (le cas échéant, leur chambre personnelle uniquement). Un espace dédié, accessible à tous et réservé au recueillement individuel, est aménagé dans chaque centre. »</span></div><div><br></div><div>\n<span style="color: rgb(29, 28, 29);">Bien cordialement</span><br>\n</div><div><div data-signature-id="2"><br></div></div>',
      __v: 0,
    },
    {
      _id: "621bc0ec46aa021b0320e281",
      name: "Association cultuelle",
      text: '<p><span style="color:rgb(31, 73, 125);">En effet, en application des textes en vigueur, la loi n° 2017-86 du 27 janvier 2017 relative à l\'égalité et à la citoyenneté (article 5) et décret n° 2020-922 du 29 juillet 2020 portant diverses dispositions relatives au service national universel, une association cultuelle ne peut pas accueillir de réservistes du SNU en MIG.</span></p><p><span style="color:rgb(31, 73, 125);">Une association est considérée comme cultuelle lorsqu\'elle a pour unique but l\'exercice public d\'un culte.</span></p><p><span style="color:rgb(31, 73, 125);"></span></p><p> </p><p></p><p><span style="color:rgb(31, 73, 125);">En revanche, sont éligibles à proposer des MIG les associations ayant un but mixte et dès lors que la mission ne porte pas sur une activité cultuelle.</span></p><p><span style="color:rgb(31, 73, 125);"></span></p><p> </p><p></p><p><span style="color:rgb(31, 73, 125);">En l’occurrence, d’après des recherches internet, il semblerait que l’association soit loi 1901 reconnue d’utilité publique et a priori recevable ; le cas échéant, vous pouvez contacter l’association pour vérifier leur statut.</span></p>',
      __v: 0,
    },
    {
      _id: "621bc0ec46aa021b0320e284",
      name: "support details",
      text: '<div><a href="https://supportdetails.com/" title="https://supportdetails.com/" rel="nofollow noreferrer noopener" target="_blank">https://supportdetails.com/</a></div>',
      __v: 0,
    },
    {
      _id: "621bc0ec46aa021b0320e287",
      name: "réinscription_process",
      text: '<p>Bonjour \n\n<span>#{ticket.customer.firstname}</span>,</p><p><br></p>\n<p>Nous vous remercions pour l\'envoi de toutes ces informations et surtout de votre patience.</p>\n<p>Suite à de trop nombreuses demandes de réinscription, notre équipe réduite n\'est pas en mesure de finaliser vos dossiers rapidement. Nous avons donc décidé de vous permettre d\'accéder directement au nouveau formulaire d\'inscription. Votre dossier d\'inscription 2021 a été supprimé.</p><p><br></p>\n<p>Cliquez sur le lien ci-dessous pour débuter votre inscription : <a href="https://moncompte.snu.gouv.fr/inscription" title="https://moncompte.snu.gouv.fr/inscription" rel="nofollow noreferrer noopener" target="_blank">https://moncompte.snu.gouv.fr/inscription</a></p>\n<p>Ce formulaire est d\'ores et déjà ouvert, et vous permet de compléter votre dossier en toute autonomie.</p>\n<p>Vous pouvez utiliser le mail que vous avez utilisé en 2021 et déposer en ligne les documents envoyés.</p>\n<p>Nous restons bien entendu disponibles, pour vous accompagner si vous rencontrez des difficultés.</p><p><br></p>\n<p>Merci de votre compréhension.</p>\n<p>A très vite au SNU !</p>\n<p><span>#{user.firstname}</span> pour l\'équipe support du SNU</p>',
      __v: 0,
    },
    {
      _id: "621bc0ec46aa021b0320e28a",
      name: "sejours 2022",
      text: "<ul>\n<li>du 13 au 25 février 2022</li>\n<li>du 12 au 24 juin 2022 </li>\n<li>du 3 au 15 juillet 2022</li>\n</ul>",
      __v: 0,
    },
    {
      _id: "621bc0ec46aa021b0320e28d",
      name: "éligibilité (lien article)",
      text: '<div><a href="https://support.snu.gouv.fr/base-de-connaissance/suis-je-eligible-a-un-sejour-de-cohesion-en-2022-1" title="https://support.snu.gouv.fr/base-de-connaissance/suis-je-eligible-a-un-sejour-de-cohesion-en-2022-1" rel="nofollow noreferrer noopener" target="_blank">https://support.snu.gouv.fr/base-de-connaissance/suis-je-eligible-a-un-sejour-de-cohesion-en-2022-1</a></div>',
      __v: 0,
    },
    {
      _id: "621bc0ec46aa021b0320e290",
      name: "nationalité",
      text: "Bonjour,<div><br></div><div>Si vous êtes en attente de recevoir la nationalité française il n'est pas possible de vous inscrire tant que vous ne l'avez pas obtenue.</div><div><br></div><div>Cependant, si vous avez la nationalité française, mais que vous n'avez pas encore le document le prouvant, vous avez la possibilité de vous inscrire.</div><div>Le référent de votre dossier mettra alors votre dossier en attente le temps d'avoir le document nécessaire à la validation de votre dossier.</div><div><br></div><div>Bien à vous<br>\n</div><div>\n<p><span style=\"color:rgb(31, 73, 125);\"></span></p>\n<p> </p>\n</div>",
      __v: 0,
    },
    {
      _id: "621bc0ec46aa021b0320e293",
      name: "problemedeconnexion",
      text: 'Je vous confirme que votre identifiant est correct : <div><span> Le message d\'erreur peut venir de plusieurs situations : </span></div><div>\n<ul>\n<li><span> mot de passe ou identifiant mal rédigés : vérifiez bien les majuscules, minuscules, les espaces, les points etc. </span></li>\n<li><span>vous ne vous êtes pas déconnecté lors de votre dernière session </span></li>\n<li><span>vous avez oublié votre mot de passe. Pas d\'inquiétude : cliquez sur "Mot de passe perdu ?" et suivez les étapes pour le réinitialiser. </span></li>\n</ul>\n<span> Si cela ne fonctionne toujours pas, voici quelques conseils : </span><br><ul>\n<li><span>appuyer sur les touches Ctrl + R avant de tenter à nouveau de vous connecter </span></li>\n<li>\n<span>passer en navigation privée \n- vider votre cache et vos cookies.  Voici les tutoriels selon votre navigateur : firefox ( </span><a href="https://support.mozilla.org/fr/kb/comment-vider-le-cache-de-firefox" rel="nofollow noreferrer noopener" target="_blank">https://support.mozilla.org/fr/kb/comment-vider-le-cache-de-firefox</a><span> ) , Google chrome ( </span><a href="https://support.google.com/accounts/answer/32050?hl=fr&amp;co=GENIE.Platform%3DDesktop" rel="nofollow noreferrer noopener" target="_blank">https://support.google.com/accounts/answer/32050?hl=fr&amp;co=GENIE.Platform%3DDesktop</a><span> ) , Microsoft Edge ( </span><a href="https://support.microsoft.com/fr-fr/microsoft-edge/afficher-et-supprimer-l-historique-du-navigateur-dans-microsoft-edge-00cf7943-a9e1-975a-a33d-ac10ce454ca4" rel="nofollow noreferrer noopener" target="_blank">https://support.microsoft.com/fr-fr/microsoft-edge/afficher-et-supprimer-l-historique-du-navigateur-dans-microsoft-edge-00cf7943-a9e1-975a-a33d-ac10ce454ca4</a><span> ). </span>\n</li>\n<li><span>cliquer plusieurs fois d\'affilée sur "se connecter" malgré l\'apparition du message d\'erreur (ne pas persister après 15 clics) </span></li>\n<li><span>utiliser un autre navigateur internet </span></li>\n<li><span>utiliser un autre ordinateur </span></li>\n</ul>\n<br><span>Si après avoir testé toutes ces solutions, aucunes ne vous a donné satisfaction, merci de revenir vers nous en nous envoyant : </span>\n</div><div>\n<ul>\n<li><span>des captures d\'écran des messages d\'erreur \n-</span></li>\n<li><span>nous envoyer l\'identifiant que vous rentrez (adresse mail uniquement) </span></li>\n<li><span>le nom de votre navigateur internet </span></li>\n<li><span>le nom de votre antivirus</span></li>\n<li><span>nous préciser toutes les options que vous avez déjà tenté. </span></li>\n</ul>\n<span><b>(!) ne communiquez jamais votre mot de passe par mail ou par message au support SNU, celui-ci est strictement confidentiel. </b></span>\n</div><div>\n<span>\nNous restons disponibles si vos difficultés persistent, </span><br>\n</div>',
      __v: 0,
    },
    {
      _id: "621bc0ec46aa021b0320e296",
      name: "assistance",
      text: "Nous restons disponibles pour vous accompagner dans la résolution de vos difficultés. ",
      __v: 0,
    },
    {
      _id: "621bc0ec46aa021b0320e299",
      name: "infos sur les volontaires pendant leur séjour de cohésion",
      text: "Nous n'avons pas ces informations à l'échelle nationale, en effet chaque centre a sa propre organisation. Pour récupérer ces informations vous pouvez soit : <br>- contacter des parents de volontaires présents dans le même centre que votre enfant <br>- contacter le chef de projet départemental, dont les coordonnées se trouvent sur la convocation de votre enfant (disponible depuis son espace volontaire)<br><br>Même si les téléphones portables sont interdits pendant le séjour, les volontaires ont des temps dédiés pour donner des nouvelles à leur famille, nous pensons que ce sera le meilleur moyen pour vous d'avoir des nouvelles.<br>",
      __v: 0,
    },
    {
      _id: "621bc0ec46aa021b0320e29c",
      name: "18anset+",
      text: '<div>Malheureusement le SNU est un dispositif accessible pour les 15-17 ans. </div><div>Toutefois si l\'engagement vous donne envie, vous pouvez regarder du côté des dispositifs suivants : </div><div>- la plateforme JeVeuxAider.gouv.fr de la Réserve Civique pour participer à des mission ponctuelles ou régulières, "à la carte" &gt; <a href="https://www.jeveuxaider.gouv.fr/" rel="nofollow noreferrer noopener" target="_blank">https://www.jeveuxaider.gouv.fr/</a> </div><div>- le Service Civique pour un engagement de 6 mois minimum au sein d\'une structure d\'accueil, moyennant une indemnisation financière &gt; <a href="https://www.service-civique.gouv.fr/" rel="nofollow noreferrer noopener" target="_blank">https://www.service-civique.gouv.fr/</a> </div><div>- participer à une préparation militaire proposée par les Armées, en se rapprochant du CIRFA le plus proche de chez vous &gt; <a href="https://www.sengager.fr/ou-nous-rencontrer" rel="nofollow noreferrer noopener" target="_blank">https://www.sengager.fr/ou-nous-rencontrer</a> </div><div>- devenir sapeurs pompiers volontaires &gt; <a href="https://www.pompiers.fr/grand-public/devenir-sapeur-pompier/devenir-sapeur-pompier-volontaire-spv" rel="nofollow noreferrer noopener" target="_blank">https://www.pompiers.fr/grand-public/devenir-sapeur-pompier/devenir-sapeur-pompier-volontaire-spv</a> </div><div>- s\'engager comme Réserviste dans la Gendarmerie Nationale &gt; <a href="https://www.lagendarmerierecrute.fr/carrieres/carriere-operationnelle/reserviste" rel="nofollow noreferrer noopener" target="_blank">https://www.lagendarmerierecrute.fr/carrieres/carriere-operationnelle/reserviste</a> </div><div>- devenir réserviste dans une Armée  &gt; <a href="https://www.defense.gouv.fr/reserve/devenir-reserviste" rel="nofollow noreferrer noopener" target="_blank">https://www.defense.gouv.fr/reserve/devenir-reserviste</a> </div><div> B<span>onne continuation ! </span>\n</div>',
      __v: 0,
    },
    {
      _id: "621bc0ec46aa021b0320e29f",
      name: "bonjour",
      text: "Bonjour #{ticket.customer.firstname} #{ticket.customer.lastname},",
      __v: 0,
    },
    {
      _id: "621bc0ec46aa021b0320e2a2",
      name: "signature",
      text: "Bien à vous <br> #{user.firstname} pour l'équipe support SNU<br>",
      __v: 0,
    },
    {
      _id: "621bc0ec46aa021b0320e2a5",
      name: "gratuit",
      text: "La participation au SNU est gratuite ! <br>Lors du séjour de cohésion, vous serez pris en charge d'un point de rassemblement jusqu'à votre centre d'accueil aller et retour. Vous serez nourri et logé.<br>En ce qui concerne la mission d'intérêt général, le transport et l'hébergement ne sont pas pris en charge, c'est pour cette raison que nous vous conseillons de la faire au plus proche de chez vous !<br>",
      __v: 0,
    },
    {
      _id: "621bc0ed46aa021b0320e2a8",
      name: "regimealimentaire",
      text: 'En ce qui concerne les intolérances ou le régime alimentaires, vous pourrez les déclarer dans la fiche sanitaire requise pour le séjour de cohésion et accessible sur le compte SNU, après la validation de l\'inscription.<br>Ce sera à mentionner dans la rubrique "Observations particulières/antécédents médicaux".<br>',
      __v: 0,
    },
    {
      _id: "621bc0ed46aa021b0320e2ab",
      name: "remplircontratengagement",
      text: "<span>Bonjour, <br>Suite à la demande de :</span><div>\n<span>qui n'avait pas de nouvelle de sa MIG  validée il y a plusieurs semaines. <br>Nous avons remarqué que vous n'aviez pas encore envoyé son contrat d'engagement.<br>Le contrat d'engagement est indispensable pour le suivi et l'encadrement des engagements des volontaires . Une MIG<u> ne peut débuter qu'après la signature de ce document</u>. </span><div><span>Pour l'envoyer il vous suffit de vous rendre sur la candidature du volontaire, de cliquer sur \"Contrat d'engagement\", de remplir les informations manquantes puis de cliquer sur le bouton bleu/violet \"Envoyer une demande de validation aux parties-prenantes\" . </span></div>\n<div><span><br></span></div>\n<div><span> Si besoin n'hésitez pas à consulter notre centre d'aide - rubrique Structure - et plus particulièrement à consulter l'article :  Le parcours d'une MIG , pour connaître les actions à réaliser pour accueillir un volontaire . \n\n\nLe référent.e Phase 2 de votre département peut également vous accompagner dans vos démarches. (Ses coordonnées sont disponibles sur votre espace. <br><br></span></div>\n<div>\n<span> Nous restons disponibles pour toute information complémentaire et vous remercions d'avance pour vos actions.<br></span>\n</div>\n</div>",
      __v: 0,
    },
    {
      _id: "621bc0ed46aa021b0320e2ae",
      name: "renvoi lien validation contrat",
      text: "Bonjour, <br><br>Vous trouverez ci-dessous le lien de validation du contrat d'engagement de : <br>Cette action est indispensable pour l'encadrement et le suivi de son engagement. <br><br>Cliquez sur ce lien : <br> <br>Merci d'avance pour votre action,",
      __v: 0,
    },
    {
      _id: "621bc0ed46aa021b0320e2b1",
      name: "examensdéjàinscrit",
      text: 'Bonjour,\nMalheureusement, les examens scolaires étant obligatoires, et n\'étant pas possible pour des raisons logistiques de quitter le centre d\'accueil du SNU pour passer une épreuve, vous ne pourrez participer au séjour de cohésion du SNU.Vous devez vous désister du SNU.\nSi l\'engagement vous donne envie, vous pouvez regarder du côté des dispositifs suivants :\r\n- la plateforme JeVeuxAider.gouv.fr de la Réserve Civique pour participer à des mission ponctuelles ou régulières, "à la carte"\r\n- le Service Civique <a href="https://www.service-civique.gouv.fr/" rel="nofollow noreferrer noopener" target="_blank">https://www.service-civique.gouv.fr/</a> pour un engagement de 6 mois minimum au sein d\'une structure d\'accueil, moyennant une indemnisation financière\r\n- participer à une préparation militaire proposée par les Armées <a href="https://www.sengager.fr/ou-nous-rencontrer" rel="nofollow noreferrer noopener" target="_blank">https://www.sengager.fr/ou-nous-rencontrer</a> , en se rapprochant du CIRFA le plus proche de chez vous\r\n- devenir sapeurs pompiers volontaires : <a href="https://www.pompiers.fr/grand-public/devenir-sapeur-pompier/devenir-sapeur-pompier-volontaire-spv" rel="nofollow noreferrer noopener" target="_blank">https://www.pompiers.fr/grand-public/devenir-sapeur-pompier/devenir-sapeur-pompier-volontaire-spv</a>\r\n- s\'engager comme Réserviste dans la Gendarmerie Nationale : <a href="https://www.lagendarmerierecrute.fr/carrieres/carriere-operationnelle/reserviste" rel="nofollow noreferrer noopener" target="_blank">https://www.lagendarmerierecrute.fr/carrieres/carriere-operationnelle/reserviste</a>\r\n- devenir réserviste dans une Armée : <a href="https://www.defense.gouv.fr/reserve/devenir-reserviste" rel="nofollow noreferrer noopener" target="_blank">https://www.defense.gouv.fr/reserve/devenir-reserviste</a>\nBonne continuation ! \nL\'équipe du Service National Universel',
      __v: 0,
    },
    {
      _id: "621bc0ed46aa021b0320e2b4",
      name: "lienconfinementetmig",
      text: 'Voici le lien vers la page d\'information concernant le confinement : <a href="https://www.snu.gouv.fr/confinement-et-mission-d-interet-general-69" rel="nofollow noreferrer noopener" target="_blank">https://www.snu.gouv.fr/confinement-et-mission-d-interet-general-69</a>',
      __v: 0,
    },
    {
      _id: "621bc0ed46aa021b0320e2b7",
      name: "contactreferent",
      text: "Les coordonnées de votre référent se trouvent sur votre espace volontaire.",
      __v: 0,
    },
    {
      _id: "621bc0ed46aa021b0320e2ba",
      name: "bugri",
      text: 'Je vous invite à recharger votre page, voir à quitter le formulaire puis y revenir, refaire la manipulation (ouvrir le règlement intérieur avant de cliquez sur "continuer"). <br>Cela devrait fonctionner à présent.<br>',
      __v: 0,
    },
    {
      _id: "621bc0ed46aa021b0320e2bd",
      name: "codedelaroute",
      text: "Les accès au e-learning du code de la route sont disponibles pour les volontaires ayant finalisé leur phase 1 du parcours SNU. Sauf pour les volontaires de la cohorte 2020, qui n'ont pas pu réaliser leur 1ère phase à cause de la situation sanitaire, leurs droits sont ouverts après réalisation de la 1ère phase qu'ils ont pu réaliser (1 ou 2). Les accès au code de la route sont transmis par le service régional. Vous devez pour cela vous rapprocher de votre référent SNU identifié sur votre compte volontaire<br>",
      __v: 0,
    },
    {
      _id: "621bc0ed46aa021b0320e2c0",
      name: "bilandesanté",
      text: "Il est recommandé d'effectuer le bilan de santé obligatoire entre 15 et 16 ans avant le séjour de cohésion.<br>Si ce dernier a déjà été fait et que les vaccins sont à jour, dans ce cas, le remplissage de la fiche sanitaire et l'ajout des photocopies des documents requis sont suffisants.<br>",
      __v: 0,
    },
    {
      _id: "621bc0ed46aa021b0320e2c3",
      name: "binomes séjour",
      text: "Les principes du SNU étant la mixité,  le brassage social et territorial, il n'est malheureusement pas possible de faire des binômes ou des équipes définies. Vous pourrez vous retrouver avec des jeunes de votre entourage, mais l'affectation se fait de façon aléatoire au niveau régional.<br>",
      __v: 0,
    },
    {
      _id: "621bc0ed46aa021b0320e2c6",
      name: "examens",
      text: 'Malheureusement, les examens scolaires étant obligatoires, et n\'étant pas possible pour des raisons logistiques de quitter le centre d\'accueil du SNU pour passer une épreuve, vous ne pourrez participer au séjour de cohésion du SNU. <div>Si l\'engagement vous donne envie, vous pouvez regarder du côté des dispositifs suivants : </div><div><ul>\n<li>la plateforme <b>JeVeuxAider.gouv.fr</b> de la Réserve Civique pour participer à des mission ponctuelles ou régulières, "à la carte" </li>\n<li>le <b>Service Civique</b> <a href="https://www.service-civique.gouv.fr/" rel="nofollow noreferrer noopener" target="_blank">https://www.service-civique.gouv.fr/</a> pour un engagement de 6 mois minimum au sein d\'une structure d\'accueil, moyennant une indemnisation financière</li>\n<li>participer à une<b> préparation militaire </b>proposée par les Armées <a href="https://www.sengager.fr/ou-nous-rencontrer" rel="nofollow noreferrer noopener" target="_blank">https://www.sengager.fr/ou-nous-rencontrer</a> , en se rapprochant du CIRFA le plus proche de chez vous </li>\n<li>devenir <b>sapeur pompier</b> volontaire : <a href="https://www.pompiers.fr/grand-public/devenir-sapeur-pompier/devenir-sapeur-pompier-volontaire-spv" rel="nofollow noreferrer noopener" target="_blank">https://www.pompiers.fr/grand-public/devenir-sapeur-pompier/devenir-sapeur-pompier-volontaire-spv</a> </li>\n<li>s\'engager comme <b>Réserviste dans la Gendarmerie Nationale</b> : <a href="https://www.lagendarmerierecrute.fr/carrieres/carriere-operationnelle/reserviste" rel="nofollow noreferrer noopener" target="_blank">https://www.lagendarmerierecrute.fr/carrieres/carriere-operationnelle/reserviste</a>\n</li>\n<li>devenir <b>réserviste dans une Armée</b> : <a href="https://www.defense.gouv.fr/reserve/devenir-reserviste" rel="nofollow noreferrer noopener" target="_blank">https://www.defense.gouv.fr/reserve/devenir-reserviste</a> </li>\n</ul></div><div><br></div><div>Nous vous souhaitons bonne continuation !</div>',
      __v: 0,
    },
    {
      _id: "621bc0ed46aa021b0320e2c9",
      name: "je vous en prie",
      text: "Je vous en prie, Belle journée !",
      __v: 0,
    },
    {
      _id: "621bc0ed46aa021b0320e2cc",
      name: "lienproposerunemig",
      text: '<a href="https://www.snu.gouv.fr/proposez-des-missions-d-interet-general-54" rel="nofollow noreferrer noopener" target="_blank">https://www.snu.gouv.fr/proposez-des-missions-d-interet-general-54</a>',
      __v: 0,
    },
    {
      _id: "621bc0ed46aa021b0320e2cf",
      name: "modifordrecandidature",
      text: "Pour modifier l&#39;ordre de vos choix de missions, il vous suffit de sélectionner la case mission et lorsque vous voyez apparaître une petite main : cliquer et déplacer le bloc.",
      __v: 0,
    },
    {
      _id: "621bc0ee46aa021b0320e2d2",
      name: "modifprofil",
      text: 'Bonjour, \nConnectez vous à votre compte SNU : <a href="https://inscription.snu.gouv.fr/auth" rel="nofollow noreferrer noopener" target="_blank">https://inscription.snu.gouv.fr/auth</a>.\nUne fois connecté(e), en haut à droite, cliquez sur vos initiales puis sur "Profil".\nSur cette page, vous pouvez changer vos informations personnelles.\nPensez bien à enregistrer avant de quitter la page.\nBien à vous\n #{user.firstname} pour l\'équipe support SNU',
      __v: 0,
    },
    {
      _id: "621bc0ee46aa021b0320e2d5",
      name: "jdc",
      text: 'La Journée de Défense et Citoyenneté (JDC) est obligatoire pour tous les citoyens recensés. <div><br></div><div>A la différence, Service National Universel (SNU) est basé sur le volontariat. La participation au séjour de cohésion du SNU dispense de la JDC. \nSans participation au séjour de cohésion du SNU, il convient de s\'inscrire à la JDC en passant par majdc.fr </div><div> Pour parler avec le support de la JDC c\'est par ici : <a href="https://presaje.sga.defense.gouv.fr/" rel="nofollow noreferrer noopener" target="_blank">https://presaje.sga.defense.gouv.fr/</a>  un chat box s\'affichera. </div>',
      __v: 0,
    },
    {
      _id: "621bc0ee46aa021b0320e2d8",
      name: "inscriptions2021closes",
      text: "Les inscriptions 2021 sont closes depuis le mois d&#39;avril.",
      __v: 0,
    },
    {
      _id: "621bc0ee46aa021b0320e2db",
      name: "modifok",
      text: "Je viens d'effectuer la modification, depuis son espace volontaire.<br>",
      __v: 0,
    },
    {
      _id: "621bc0ee46aa021b0320e2de",
      name: "motdepasseperdu",
      text: 'Si vous ne vous souvenez plus du mot de passe, depuis la page de connexion à votre compte SNU (<a href="https://inscription.snu.gouv.fr/auth)" rel="nofollow noreferrer noopener" target="_blank" title="https://inscription.snu.gouv.fr/auth)">https://moncompte.snu.gouv.fr/auth)</a>, cliquez sur "Mot de passe perdu ?\' puis : <div><ul>\n<li>entrez votre adresse email et validez </li>\n<li>ouvrez le lien de réinitialisation reçu par email </li>\n<li>définissez un nouveau mot de passe selon les critères définies </li>\n<li>accédez à votre compte </li>\n</ul></div>',
      __v: 0,
    },
    {
      _id: "621bc0ee46aa021b0320e2e1",
      name: "pasmig",
      text: 'Lorsque vous ne trouvez pas de MIG à proximité de chez vous voici différentes possibilités :<div><ul>\n<li>depuis l\'onglet préférences, renseigner l\'adresse d\'un proche,  chez qui vous pourrez loger le temps de la mission </li>\n<li>trouvez votre MIG en contactant les structures proches de chez vous et en leur proposant de rejoindre le dispositif , voici les informations que vous pouvez leur transmettre : <a href="https://www.snu.gouv.fr/proposez-des-missions-d-interet-general-54" rel="nofollow noreferrer noopener" target="_blank">https://www.snu.gouv.fr/proposez-des-missions-d-interet-general-54</a> </li>\n<li>attendez la publication de nouvelles offres de missions. Les structures publient des offres tout au long de l\'année. </li>\n</ul></div>',
      __v: 0,
    },
    {
      _id: "621bc0ee46aa021b0320e2e4",
      name: "recensement",
      text: 'Le recensement s\'effectue auprès de votre mairie ! \nJe vous invite à consulter le site de votre mairie.\nVoici les informations officielles : <a href="https://www.service-public.fr/particuliers/vosdroits/F870" rel="nofollow noreferrer noopener" target="_blank">https://www.service-public.fr/particuliers/vosdroits/F870</a> ',
      __v: 0,
    },
    {
      _id: "621bc0ee46aa021b0320e2e7",
      name: "representantlegal",
      text: "L'autorité parentale étant a priori partagée par les deux parents, il vous faut renseigner les deux dans la section \"Représentants légaux\" ainsi que renseigner la signature des deux dans le consentement parental.<br>Si dans votre cas, l'autorité parentale n'est que portée par l'un d'entre eux, il vous faut joindre un justificatif type la présentation du livret de famille ou décision du juge (décision temporaire compte tenu de l’absence ou de l’incapacité d’un parent, mise à distance d’un parent, etc.).<br>Vous pouvez téléverser le document dans l'onglet \"consentements\", joint avec le consentement parental (sélectionnez les 2 documents en même temps lors du téléversement, et non l'un puis l'autre).<br>",
      __v: 0,
    },
    {
      _id: "621bc0ee46aa021b0320e2ea",
      name: "support fermé",
      text: 'Ceci est un mail automatique, merci de ne pas y répondre. \n\nBonjour, \n\nNous avons bien reçu votre demande, malheureusement nos bureaux sont actuellement fermés. 😴\nPour plus de rapidité, nous vous invitons à consulter les liens ci-dessous : \n\n1/ Consultez notre centre d\'aide : <a href="https://support.snu.gouv.fr/base-de-connaissance" rel="nofollow noreferrer noopener" target="_blank">https://support.snu.gouv.fr/base-de-connaissance</a> \n2/ Consultez notre FAQ (Foire aux questions) : <a href="https://www.snu.gouv.fr/foire-aux-questions-11" rel="nofollow noreferrer noopener" target="_blank">https://www.snu.gouv.fr/foire-aux-questions-11</a> \n\nNous serons bientôt de retour, \nA bientôt, \nL\'équipe support du SNU',
      __v: 0,
    },
    {
      _id: "621bc0ee46aa021b0320e2ed",
      name: "retourlong",
      text: "Veuillez nous excuser pour le délai de notre retour.",
      __v: 0,
    },
    {
      _id: "621bc0ee46aa021b0320e2f0",
      name: "ajoutboucleref",
      text: "J&#39;ajoute à notre échange (en copie de ce mail) votre référent départemental :",
      __v: 0,
    },
    {
      _id: "621bc0ee46aa021b0320e2f3",
      name: "identifiantincorrect",
      text: 'Avant de tenter à nouveau de vous connecter, pouvez-vous effectuer les démarches suivantes : \n- vider vos cookies et cache. Voici les tutoriels selon votre navigateur : firefox ( <a href="https://support.mozilla.org/fr/kb/comment-vider-le-cache-de-firefox" rel="nofollow noreferrer noopener" target="_blank">https://support.mozilla.org/fr/kb/comment-vider-le-cache-de-firefox</a> ) , Google chrome ( <a href="https://support.google.com/accounts/answer/32050?hl=fr&amp;co=GENIE.Platform%3DDesktop" rel="nofollow noreferrer noopener" target="_blank">https://support.google.com/accounts/answer/32050?hl=fr&amp;co=GENIE.Platform%3DDesktop</a> ) , Microsoft Edge ( <a href="https://support.microsoft.com/fr-fr/microsoft-edge/afficher-et-supprimer-l-historique-du-navigateur-dans-microsoft-edge-00cf7943-a9e1-975a-a33d-ac10ce454ca4" rel="nofollow noreferrer noopener" target="_blank">https://support.microsoft.com/fr-fr/microsoft-edge/afficher-et-supprimer-l-historique-du-navigateur-dans-microsoft-edge-00cf7943-a9e1-975a-a33d-ac10ce454ca4</a> ). \n- appuyer sur les touches Ctrl + R\nEst-ce que cela a fonctionné ?',
      __v: 0,
    },
    {
      _id: "621bc0ee46aa021b0320e2f6",
      name: "validationcontratengagement",
      text: "Les contrats d&#39;engagement ne peuvent pas être validés depuis les espaces admin ou volontaire, il est nécessaire de recevoir le lien par mail pour y accéder. Celui-ci est strictement confidentiel et personnel.",
      __v: 0,
    },
    {
      _id: "621bc0ee46aa021b0320e2f9",
      name: "surespacevolontaire",
      text: 'Cette information se trouve sur votre/son espace volontaire à consulter depuis ce lien : <a href="https://inscription.snu.gouv.fr/auth/login" rel="nofollow noreferrer noopener" target="_blank" title="https://inscription.snu.gouv.fr/auth/login">https://moncompte.snu.gouv.fr/auth/login</a> ',
      __v: 0,
    },
    {
      _id: "621bc0ee46aa021b0320e2fc",
      name: "tosd",
      text: "Bonjour, <br><br>nous avons bien pris en compte votre message et les faits que vous relatez. Nous transférons votre message à la sous-direction du SNU, au ministère de l’éducation nationale et de la jeunesse pour suite à donner.<br>",
      __v: 0,
    },
    {
      _id: "621bc0ef46aa021b0320e2ff",
      name: "transportethebergementmig",
      text: "Ttoutes les informations relatives aux missions sont inscrites sur la fiche mission.<br>Le transport et l'hébergement ne sont pas pris en charge par l'Etat pour les MIG, cependant certaines structures peuvent proposer l'hébergement et/ou transport . Pour en savoir plus il faut vous rapprocher de la structure qui a publié la mission.<br>",
      __v: 0,
    },
    {
      _id: "621bc0ef46aa021b0320e302",
      name: "validation inscription mig",
      text: ' Vous pouvez suivre l\'évolution de votre candidature depuis votre compte SNU (<a href="https://inscription.snu.gouv.fr/auth)" rel="nofollow noreferrer noopener" target="_blank" title="https://inscription.snu.gouv.fr/auth)">https://moncompte.gouv.fr/auth)</a>.\nUne fois que votre candidature est validée, vous recevrez un email vous le notifiant et précisant la suite des évènement. ',
      __v: 0,
    },
    {
      _id: "621bc0ef46aa021b0320e305",
      name: "validation mig",
      text: "Bonjour #{ticket.customer.firstname},<br>Je m'appelle #{user.firstname} et je travaille au support de la plateforme numérique du SNU.<br>Nous avons reçu la demande de : <br>responsable de la structure : <br> car sa mission publiée il y a quelques temps n'a pas reçu de retours de votre part. Pourriez-vous la valider ou le cas échéant revenir vers elle afin qu'elle/il apporte les modifications nécessaires ?  En effet cette étape est cruciale pour permettre aux volontaires de pouvoir candidater.<br>Voici le lien de la mission :  <br>Merci d'avance pour votre action,<br>",
      __v: 0,
    },
    {
      _id: "621bc0ef46aa021b0320e308",
      name: "sedesister",
      text: '<div>Vous pouvez vous désister directement depuis votre compte SNU. </div><div>Connectez-vous à votre compte (<a href="https://inscription.snu.gouv.fr/auth)" rel="nofollow noreferrer noopener" title="https://inscription.snu.gouv.fr/auth)" target="_blank">https://moncompte.snu.gouv.fr/auth)</a> puis cliquez sur "Se désister du SNU" juste en dessous du bouton : "Besoin d\'aide ? "à gauche de votre écran. </div>',
      __v: 0,
    },
    {
      _id: "621bc0ef46aa021b0320e30b",
      name: "vaccin",
      text: "<div>Les mesures qui s'appliquent pour le séjour de cohésion, sont celles indiquées pour les Accueils Collectifs de Mineurs. <br>\n</div><div>A ce jour, il n'est pas demandé de passe sanitaire pour participer au séjour de cohésion, ni un parcours vaccinal complet contre le Covid.  </div><div></div><div>Un test PCR ou antigénique négatif pourra être requis avant de partir au séjour de cohésion , de plus une autorisation de pratiquer des auto tests sera demandée pour la durée du séjour. Nous vous transmettrons plus d'informations sur ce sujet, dans les semaines qui précèderont le séjour.  </div>",
      __v: 0,
    },
    {
      _id: "621bc0ef46aa021b0320e30e",
      name: "base de connaissance (lien)",
      text: '<div><a href="https://support.snu.gouv.fr/base-de-connaissance" title="https://support.snu.gouv.fr/base-de-connaissance" rel="nofollow noreferrer noopener" target="_blank">https://support.snu.gouv.fr/base-de-connaissance</a></div>',
      __v: 0,
    },
    {
      _id: "621bc0ef46aa021b0320e311",
      name: "examencode",
      text: "<span>Les volontaires ayant effectué les deux premières phases du SNU peuvent bénéficier d’une première présentation gratuite à l’ETG (examen du code de la route). </span><div><span>Pour ce faire, dès lors que les volontaires disposent de leurs deux attestations de réalisation : du séjour de cohésion et de la MIG, ils peuvent entamer les démarches d’inscription sur la plateforme de l’ANTS. Ils devront, au cours de leur inscription, téléverser leurs deux attestations. </span></div><div><span><br></span></div><div><span>Ils obtiendront un numéro NEPH (numéro d’enregistrement préfectoral  harmonisé) comme pout tous les candidats au permis et auront ensuite à choisir, toujours sur le site de l’ANTS, l’organisme agréé, parmi ceux qui leur seront proposés, pour l’ETG. Ils n’auront rien à débourser pour cette première présentation à l’examen.</span></div>",
      __v: 0,
    },
    {
      _id: "621bc0ef46aa021b0320e314",
      name: "supportosmose",
      text: "<span>osmose.dinum@modernisation.gouv.fr</span>",
      __v: 0,
    },
    {
      _id: "621bc0ef46aa021b0320e317",
      name: "cool",
      text: "Nous allons regarder cela ensemble.",
      __v: 0,
    },
    {
      _id: "621bc0ef46aa021b0320e31a",
      name: "fonctionnonrenseigneeequipe",
      text: "<span> Suite à la demande d'un volontaire qui a souhaité contacter : </span><div><span> et dont le mail lui est revenu, nous nous sommes rendus compte que plusieurs comptes de référents départementaux étaient enregistrés sur la plateforme du SNU pour votre département . </span></div><div><span><br></span></div><div><span>Ci-joint la capture d'écran des comptes . <br><br></span></div><div><span>Toutes vos adresses mails sont rattachées à un compte. Pourriez-vous par retour de mail nous dire parmi les comptes ci-dessus : <br> - lesquels ne sont plus actifs et que nous devrions supprimer :\n<br>- lesquels ont des identifiants erronés <br> - qui au sein de votre équipe est référent phase 2* <br> - qui au sein de votre équipe est Chef de projet départemental et habilité à signer les contrats d'engagement* <br><i><br>*Ces 2 fonctions doivent être renseignées sur la plateforme pour permettre le suivi des candidatures de MIG, validation des pièces justificatives de PM et validation des contrats d'engagement. </i><br> Merci d'avance pour votre retour,<br></span></div>",
      __v: 0,
    },
    {
      _id: "621bc0ef46aa021b0320e31d",
      name: "migparsoimeme",
      text: "Tout d'abord, si vous avez trouvé votre MIG par vous même : Félicitations ! <div><br></div><div>Afin d'informer la structure qui va vous accueillir vous pouvez tout d'abord lui transmettre ce lien : \n<a href=\"https://www.snu.gouv.fr/proposez-des-missions-d-interet-general-54\" rel=\"nofollow noreferrer noopener\" target=\"_blank\">https://www.snu.gouv.fr/proposez-des-missions-d-interet-general-54</a> </div><div> Il est ensuite nécessaire que celle-ci s'inscrive et publie sa mission sur la plateforme afin que votre engagement soit cadré et suivi , dans le cadre de votre parcours. </div><div><br></div><div>Après acceptation de votre candidature, le contrat d'engagement sera généré automatiquement via la plateforme et l'ensemble des parties (représentant de l'Etat, représentant légal, représentant de la structure) pourront valider ce contrat électroniquement. </div><div> Ces démarches doivent être réalisées avant le début de votre mission. </div><div>N'hésitez pas à contacter votre référent départemental pour qu'il vous accompagne dans vos démarches.</div>",
      __v: 0,
    },
    {
      _id: "621bc0ef46aa021b0320e320",
      name: "qui accueille volontaire",
      text: "<span>Les structures pouvant offrir des MIG relèvent des alinéas 1 et 2 de l’article 4 de la loi 2017-86 du 27 janvier 2017, dite loi égalité et citoyenneté :\n\n« Les missions relevant de la réserve civique peuvent être proposées par une personne morale de droit public ou, sous réserve du deuxième alinéa, par un organisme sans but lucratif de droit français au titre d'un projet d'intérêt général répondant aux orientations de la réserve civique et aux valeurs qu'elle promeut.\n\nUne association cultuelle ou politique, une organisation syndicale, une congrégation, une fondation d'entreprise ou un comité d'entreprise ne peut accueillir de réservistes. »</span>",
      __v: 0,
    },
    {
      _id: "621bc0ef46aa021b0320e323",
      name: "lien avenant contrat",
      text: '<a href="https://osmose.numerique.gouv.fr/jcms/78661160_DBFileDocument/20200615-msnu-avenant-au-contrat-d-engagement-mig" rel="nofollow noreferrer noopener" target="_blank">https://osmose.numerique.gouv.fr/jcms/78661160_DBFileDocument/20200615-msnu-avenant-au-contrat-d-engagement-mig</a>',
      __v: 0,
    },
    {
      _id: "621bc0ef46aa021b0320e326",
      name: "sign_volontaire",
      text: '<div>#{user.firstname} pour l\'équipe support SNU<br>\n</div><div>\n<p><a href="https://snu.gouv.fr/" rel="nofollow noreferrer noopener" target="_blank">snu.gouv.fr</a></p>\n<p><a href="https://support.snu.gouv.fr/base-de-connaissance/livret-daccueil-volontaire" rel="nofollow noreferrer noopener" title="https://support.snu.gouv.fr/base-de-connaissance/livret-daccueil-volontaire" target="_blank">🙂 Livret d\'accueil volontaire</a></p>\n</div>',
      __v: 0,
    },
    {
      _id: "621bc0ef46aa021b0320e329",
      name: "prochainesession",
      text: 'Pour être tenu informé.e des ouvertures des inscriptions pour le prochain séjour de cohésion vous pouvez vous inscrire en cliquant sur ce lien : <a href="https://moncompte.snu.gouv.fr/inscription" title="https://moncompte.snu.gouv.fr/inscription" rel="nofollow noreferrer noopener" target="_blank">https://moncompte.snu.gouv.fr/inscription</a>',
      __v: 0,
    },
    {
      _id: "621bc0f046aa021b0320e32c",
      name: "dsl reception",
      text: "Veuillez nous excuser, nous avons rencontré un problème technique et venons de recevoir votre demande seulement aujourd&#39;hui. ",
      __v: 0,
    },
    {
      _id: "621bc0f046aa021b0320e32f",
      name: "dispo",
      text: "Nous restons disponibles pour toute information complémentaire. ",
      __v: 0,
    },
    {
      _id: "621bc0f046aa021b0320e332",
      name: "sign_referent",
      text: 'Bien à vous, <br><div>\n<span>#{user.firstname}</span> pour l\'équipe support SNU </div><div><br></div><div>\n<b>Nos permanences : </b><br>- Echangez en visio ou par téléphone sur un cas particulier (15 min) : <a href="https://calendly.com/supportsnu/permanence-referents?month=2021-10" rel="nofollow noreferrer noopener" title="https://calendly.com/supportsnu/permanence-referents?month=2021-10" target="_blank">en cliquant ici</a>\n</div><div>- Réservez un créneau pour votre équipe régionale pour évoquer des problématiques communes (45 min) : <a href="https://calendly.com/support-snu/permanence-regionale?month=2021-10" rel="nofollow noreferrer noopener" title="https://calendly.com/support-snu/permanence-regionale?month=2021-10" target="_blank">en cliquant ici</a> <br>\n</div><div>\n<br><b>Besoin d\'informations : </b>\n</div><div>- Tutoriels, fiches informatives : <a href="https://support.snu.gouv.fr/base-de-connaissance" title="https://support.snu.gouv.fr/base-de-connaissance" rel="nofollow noreferrer noopener" target="_blank">https://support.snu.gouv.fr/base-de-connaissance</a><span> </span>\n</div><div>\n<span>- Forum partagé entre référent : </span><a href="https://osmose.numerique.gouv.fr/jcms/c_2075355/service-national-universel" title="https://osmose.numerique.gouv.fr/jcms/c_2075355/service-national-universel" rel="nofollow noreferrer noopener" target="_blank">https://osmose.numerique.gouv.fr/jcms/c_2075355/service-national-universel</a>\n</div><div><br></div><div>\n<i>Webinaires bimensuels - Jeudi à 14h00 (</i><i><a href="https://osmose.numerique.gouv.fr/jcms/p_3552547/webinaire-bi-mensuel-des-referents-departementaux" rel="nofollow noreferrer noopener" title="https://osmose.numerique.gouv.fr/jcms/p_3552547/webinaire-bi-mensuel-des-referents-departementaux" target="_blank">+ infos sur osmose</a> )</i>\n</div>',
      __v: 0,
    },
    {
      _id: "621bc0f046aa021b0320e335",
      name: "identifiant(volontaire)",
      text: 'Bonjour, <div>Votre identifiant est bien : <br>Pour réinitialiser votre mot de passe, nous vous invitons à vous connecter sur le lien : <a href="https://moncompte.snu.gouv.fr/auth/login" title="https://moncompte.snu.gouv.fr/auth/login" rel="nofollow noreferrer noopener" target="_blank">https://moncompte.snu.gouv.fr/auth/login</a> puis de cliquer sur le texte : Mot de passe perdu ? . Il vous suffit ensuite simplement de suivre les étapes de réinitialisation. </div><div><br></div><div>Bien à vous, </div>',
      __v: 0,
    },
    {
      _id: "621bc0f046aa021b0320e338",
      name: "sign_structure",
      text: '<p>#{user.firstname} pour l\'équipe support </p><p><a href="http://snusnu.gouv.fr/" rel="nofollow noreferrer noopener" title="http://SNUsnu.gouv.fr" target="_blank">snu.gouv.fr</a> </p><div>\n<a href="https://support.snu.gouv.fr/base-de-connaissance/livret-daccueil-structure-1" rel="nofollow noreferrer noopener" title="https://support.snu.gouv.fr/base-de-connaissance/livret-daccueil-structure-1" target="_blank">🏠 Livret d\'accueil structure</a> (Tutoriels et informations)</div>',
      __v: 0,
    },
  ];

  for (let el of arr) {
    await ShortcutModel.create({ name: el.name, text: el.text });
  }

  await cleanIndex("text-module", ShortcutModel);
  console.log("END CREATE SHORTCUTS");
})();

(async () => {
  console.log("START DELETE ALL TICKETS");
  await TicketModel.deleteMany({});
  console.log("END DELETE ALL TICKETS");

  console.log("START CREATE TICKETS");
  const arr = [];
  arr.push({
    number: 1,
    source: "MAIL",
    status: "NEW",
    subject: "SUJET 1",
    folder: "Paris",
    tags: ["Connexion"],
    agentId: "620fa564547a8add6c78c481",
    contactId: "620fa564547a8add6c78c471",
    contactLastName: "Contact1",
    contactFirstName: "Contact1",
    agentLastName: "Agent1",
    agentFirstName: "Agent1",
    _id: "620fa564547a8add6c78c461",
  });
  arr.push({
    number: 2,
    source: "CHAT",
    status: "NEW",
    subject: "SUJET 2",
    folder: "Paris",
    tags: ["Connexion"],
    agentId: "620fa564547a8add6c78c482",
    contactId: "620fa564547a8add6c78c472",
    contactLastName: "Contact2",
    contactFirstName: "Contact2",
    agentLastName: "Agent2",
    agentFirstName: "Agent2",
    _id: "620fa564547a8add6c78c462",
  });
  arr.push({
    number: 3,
    source: "MAIL",
    status: "NEW",
    subject: "SUJET 3",
    folder: "-18",
    tags: ["Connexion"],
    agentId: "620fa564547a8add6c78c483",
    contactId: "620fa564547a8add6c78c473",
    contactLastName: "Contact3",
    contactFirstName: "Contact3",
    agentLastName: "Agent3",
    agentFirstName: "Agent3",
    _id: "620fa564547a8add6c78c463",
  });
  arr.push({
    number: 4,
    source: "MAIL",
    status: "NEW",
    subject: "SUJET 4",
    folder: "Paris",
    tags: ["Bug", "Mail"],
    agentId: "620fa564547a8add6c78c484",
    contactId: "620fa564547a8add6c78c474",
    contactLastName: "Contact4",
    contactFirstName: "Contact4",
    agentLastName: "Agent4",
    agentFirstName: "Agent4",
    _id: "620fa564547a8add6c78c464",
  });

  for (let i = 0; i < arr.length; i++) {
    await TicketModel.create(arr[i]);
  }
  await cleanIndex("ticket", TicketModel);

  console.log("END CREATE TICKETS");
})();

(async () => {
  console.log("START DELETE ALL MESSAGES");
  await MessageModel.deleteMany({});
  console.log("END DELETE ALL MESSAGES");

  console.log("START CREATE MESSAGES");
  const arr = [];
  arr.push({
    ticketId: "620fa564547a8add6c78c461",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tincidunt nunc ipsum tempor purus vitae id. Morbi in vestibulum nec varius.",
    authorId: "620fa564547a8add6c78c471",
  });
  arr.push({
    ticketId: "620fa564547a8add6c78c461",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tincidunt nunc ipsum tempor purus vitae id. Morbi in vestibulum nec varius.",
    authorId: "620fa564547a8add6c78c481",
  });
  arr.push({
    ticketId: "620fa564547a8add6c78c462",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tincidunt nunc ipsum tempor purus vitae id. Morbi in vestibulum nec varius.",
    authorId: "620fa564547a8add6c78c472",
  });
  arr.push({
    ticketId: "620fa564547a8add6c78c462",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tincidunt nunc ipsum tempor purus vitae id. Morbi in vestibulum nec varius.",
    authorId: "620fa564547a8add6c78c482",
  });
  arr.push({
    ticketId: "620fa564547a8add6c78c463",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tincidunt nunc ipsum tempor purus vitae id. Morbi in vestibulum nec varius.",
    authorId: "620fa564547a8add6c78c473",
  });
  arr.push({
    ticketId: "620fa564547a8add6c78c463",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tincidunt nunc ipsum tempor purus vitae id. Morbi in vestibulum nec varius.",
    authorId: "620fa564547a8add6c78c483",
  });
  arr.push({
    ticketId: "620fa564547a8add6c78c464",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tincidunt nunc ipsum tempor purus vitae id. Morbi in vestibulum nec varius.",
    authorId: "620fa564547a8add6c78c474",
  });
  arr.push({
    ticketId: "620fa564547a8add6c78c464",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tincidunt nunc ipsum tempor purus vitae id. Morbi in vestibulum nec varius.",
    authorId: "620fa564547a8add6c78c484",
  });

  for (let i = 0; i < arr.length; i++) {
    await MessageModel.create(arr[i]);
  }

  await cleanIndex("Message", MessageModel);
  console.log("END CREATE MESSAGES");
})();

async function cleanIndex(index, model) {
  console.log("REMOVE INDEX ", index);
  const exists = await esClient.indices.exists({ index });
  if (exists) await esClient.indices.delete({ index });
  console.log("CREATE INDEX");

  let bulk = [];

  async function flush() {
    const bodyES = bulk.flatMap((obj) => {
      let objFormatted = obj.toObject();
      delete objFormatted._id;
      return [{ index: { _index: index, _id: obj._id.toString() } }, objFormatted];
    });
    await esClient.bulk({ refresh: true, body: bodyES });
    console.log("INDEXED", bulk.length);
    bulk = [];
  }

  async function findAll(Model, where, cb) {
    let count = 0;
    const total = await Model.countDocuments(where);
    await Model.find(where)
      .cursor()
      .addCursorFlag("noCursorTimeout", true)
      .eachAsync(async (doc) => {
        try {
          await cb(doc, count++, total);
        } catch (e) {
          console.log("e", e);
        }
      });
  }

  await findAll(model, {}, async (doc, i, total) => {
    try {
      console.log(`Indexing ${index} ${i}/${total}`);
      bulk.push(doc);
      if (bulk.length >= 100) await flush();
    } catch (e) {
      console.log("Error", e);
    }
  });

  await flush();
}

async (shortcuts) => {
  try {
    for (let shortcut of shortcuts) {
      if (shortcut.active) {
        let obj = {
          name: shortcut.name,
        };
        let newShortcut = await FolderModel.create(obj);
        console.log("HEHE ❣️", newShortcut);
      }
    }
  } catch (error) {
    console.log("🚫", error);
  }
};
async () => {
  try {
    const tags = await ShortcutModel.find();
    console.log(JSON.stringify(tags));
  } catch (error) {
    console.log(error);
  }
};
