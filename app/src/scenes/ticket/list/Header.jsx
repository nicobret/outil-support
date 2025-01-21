import { Popover, Transition } from "@headlessui/react";
import React, { Fragment, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { HiChevronDown, HiOutlineClipboardList, HiXCircle, HiTrash } from "react-icons/hi";
import { IoStopCircle } from "react-icons/io5";
import { SORTING, SOURCES, STATUS, PARCOURSLIST } from "../../../constants";
import API from "../../../services/api";
import { classNames, getStatusColor, sourceToIcon, translateRole, translateSource, sortAgents } from "../../../utils";
import { departmentLookUp } from "../../../utils/region-and-departments.utils";
import MacroDropdown from "../components/MacroDropdown";
import FilterDropdown from "../../../components/FilterDropdown";
import SortDropdown from "../../../components/SortDropdown";
import { capture } from "../../../sentry";
import { API_SNU_URL } from "../../../config";

export default function ({ filter, update, aggregations, selectedTicket, setSelectedTicket, tickets, user, advancedSearch, agents }) {
  let toTreatTicket = aggregations.status?.find((a) => a.key === "NEW")?.doc_count || 0;
  toTreatTicket += aggregations.status?.find((a) => a.key === "OPEN")?.doc_count || 0;
  toTreatTicket += aggregations.status?.find((a) => a.key === "PENDING")?.doc_count || 0;
  const [cohortList, setCohortList] = useState([]);

  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        const response = await fetch(`${API_SNU_URL}/cohort/public`);
        const data = await response.json();
        if (response.ok) {
          const cohortNames = data.data.map((cohort) => cohort.name);
          setCohortList(cohortNames);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des cohortes", error);
      }
    };

    fetchCohorts();
  }, []);

  const modifySelectedTickets = async (selectedTicket) => {
    try {
      if (!selectedTicket?.length) return;

      const body = {
        agentFirstName: "",
        agentLastName: "",
        agentEmail: "",
        agentId: "",
      };

      for (let ticketId of selectedTicket) {
        const { ok } = await API.put({
          path: `/ticket/${ticketId}`,
          body,
        });
        if (!ok) {
          toast.error("Erreur lors de la mise à jour du ticket");
          return;
        }
        toast.success("Ticket desassigné");
        update({ ...filter });
      }
    } catch (e) {
      capture(e);
    }
  };

  const commonSortAction = [
    { name: "Du plus récent (date de création)", handleClick: () => update({ ...filter, sorting: SORTING.CREATIONDATE }) },
    { name: "Du plus récent (date de mise à jour)", handleClick: () => update({ ...filter, sorting: SORTING.UPDATEDATE }) },
  ];

  const sortActions = user.role === "AGENT" ? [{ name: "Par agent", handleClick: () => update({ ...filter, sorting: SORTING.AGENT }) }, ...commonSortAction] : commonSortAction;

  return (
    <>
      <div className="mb-4 flex items-center justify-between pl-6 pr-[30px]">
        <h6 className="flex text-gray-900">
          <strong>{advancedSearch ? "Recherche avancée" : "Boîte de réception"}</strong>
          {user.role === "AGENT" ? <div className="pl-3"> ({toTreatTicket} tickets à traiter) </div> : <div className="pl-3"> ({toTreatTicket} messages à traiter) </div>}
        </h6>

        <div className="flex">
          {user.role === "AGENT" && (
            <>
              <button
                className="flex h-[40px] w-full cursor-pointer items-center rounded-md border border-gray-300 bg-white px-4 mr-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                onClick={() => modifySelectedTickets(selectedTicket)}
              >
                <p className="w-full">Désassigner</p>
              </button>

              <FilterDropdown name="Action" icon={<HiOutlineClipboardList />} buttonClass="rounded-l-md">
                <MacroDropdown selectedTicket={selectedTicket} onClose={() => update(filter) && setSelectedTicket([])} onRefresh={() => update(filter)} />
              </FilterDropdown>
            </>
          )}
          <SortDropdown items={sortActions} buttonClass={`${user.role === "AGENT" ? "rounded-r-md" : "rounded-md"}`} />
        </div>
      </div>
      <Tab filter={filter} setFilter={(f) => update(f)} statusArr={aggregations.status} user={user} toTreatTicket={toTreatTicket} />
      {(user.role === "AGENT" || user.role === "DG") && (
        <Filter
          filter={filter}
          setSelectedTicket={setSelectedTicket}
          tickets={tickets}
          selectedTicket={selectedTicket}
          setFilter={(f) => update(f)}
          agents={agents}
          cohortList={cohortList}
        />
      )}
    </>
  );
}

const useKeyPress = (targetKey) => {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = ({ key }) => {
      if (key === targetKey) {
        setKeyPressed(true);
      }
    };

    const upHandler = ({ key }) => {
      if (key === targetKey) {
        setKeyPressed(false);
      }
    };

    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);

    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, [targetKey]);

  return keyPressed;
};

const Filter = ({ filter, setFilter, tickets, selectedTicket, setSelectedTicket, agents, cohortList }) => {
  return (
    <div>
      <div className=" flex items-start gap-3 pr-[30px] pl-6">
        <SelectAll tickets={tickets} selectedTicket={selectedTicket} setSelectedTicket={setSelectedTicket} />

        <DropdownContactGroup name="Emetteur" selectedContactGroup={filter.contactGroup} setSelectedContactGroup={(contactGroup) => setFilter({ ...filter, contactGroup })} />
        <DropdownSources name="Source" selectedSources={filter.sources} setSelectedSources={(sources) => setFilter({ ...filter, sources })} />
        <DropdownAgent name="Agent" selectedAgent={filter.agent} setSelectedAgent={(agent) => setFilter({ ...filter, agent })} agents={agents} />
        <DropdownContactDepartment
          name="Departement"
          selectedContactDepartment={filter.contactDepartment}
          setSelectedContactDepartment={(contactDepartment) => setFilter({ ...filter, contactDepartment })}
          status={filter.status}
        />
        <DropdownContactCohort
          name="Cohorte"
          selectedContactCohort={filter.contactCohort}
          setSelectedContactCohort={(contactCohort) => setFilter({ ...filter, contactCohort })}
          cohortList={cohortList}
        />
        <DropdownParcours name="Parcours" selectedParcours={filter.parcours} setSelectedParcours={(parcours) => setFilter({ ...filter, parcours })} />
        <AutoCompleteContact value={filter.contactId} onChange={(contactId) => setFilter({ ...filter, contactId })} />
        <AutoCompleteTags value={filter.tag} onChange={(tag) => setFilter({ ...filter, tag })} />
        <div className="flex">
          <HiXCircle
            className="mt-[9px] cursor-pointer text-xl text-red-700"
            onClick={() =>
              setFilter({
                page: 1,
                status: "",
                sources: [],
                agent: [],
                agentId: "",
                contactId: "",
                folderId: "",
                sorting: "",
                ticketId: "",
                tag: "",
                contactGroup: [],
                size: 30,
                contactDepartment: [],
                contactCohort: [],
                parcours: [],
              })
            }
          />
        </div>
      </div>
    </div>
  );
};
const Tab = ({ filter, setFilter, statusArr = [], user, toTreatTicket }) => {
  const TabButton = ({ name, status, onClick }) => {
    const color = getStatusColor(status);
    const count = statusArr.find((item) => item.key === status)?.doc_count || 0;
    return (
      <button
        className={classNames(
          status === filter.status ? "border-indigo-500 text-accent-color" : "border-transparent text-gray-500",
          "flex items-center gap-2 border-b-2 px-1 pb-4"
        )}
        onClick={onClick}
      >
        <span className="text-sm font-medium">{name}</span>
        {name !== "Tous" && <span className={`rounded-full py-0.5 px-2.5 text-xs ${color}`}>{name === "À traiter" ? toTreatTicket : count}</span>}
      </button>
    );
  };

  return (
    <div className="mb-4 mr-[30px] ml-6 flex gap-9 border-b border-gray-200">
      <TabButton name="À traiter" status={STATUS.TOTREAT} onClick={() => setFilter({ ...filter, status: STATUS.TOTREAT, page: 1 })} />
      <TabButton name="Nouveau" status={STATUS.NEW} onClick={() => setFilter({ ...filter, status: STATUS.NEW, page: 1 })} />
      <TabButton name="Ouvert" status={STATUS.OPEN} onClick={() => setFilter({ ...filter, status: STATUS.OPEN, page: 1 })} />
      <TabButton name="En attente" status={STATUS.PENDING} onClick={() => setFilter({ ...filter, status: STATUS.PENDING, page: 1 })} />
      <TabButton name={"Fermé"} status={STATUS.CLOSED} onClick={() => setFilter({ ...filter, status: STATUS.CLOSED, page: 1 })} />
      <TabButton name="Brouillon" status={STATUS.DRAFT} onClick={() => setFilter({ ...filter, status: STATUS.DRAFT, page: 1 })} />
      <TabButton name="Tous" status="" onClick={() => setFilter({ ...filter, status: "", page: 1 })} />
    </div>
  );
};

const DropdownSources = ({ name, selectedSources, setSelectedSources }) => {
  const handleChangeState = (source, value) => {
    if (value) return setSelectedSources([...new Set([...selectedSources, source])]);

    return setSelectedSources(selectedSources.filter((item) => item !== source));
  };

  const Checkbox = ({ name, state, setState }) => {
    return (
      <label className="flex items-center justify-between py-2 pl-4 pr-3 transition-colors hover:bg-gray-50">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <input type="checkbox" checked={state} onChange={(e) => setState(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
      </label>
    );
  };

  return (
    <div>
      <Popover className="relative grow">
        <Popover.Button className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white py-2 pl-4 pr-3">
          <span className="text-left text-sm text-grey-text">{name}</span>
          <HiChevronDown className="text-xl text-gray-500" />
        </Popover.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Popover.Panel className="absolute z-10 mt-2 flex w-full min-w-[224px] origin-top-left flex-col rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
            <Checkbox name="✉️  Mail" state={selectedSources.includes(SOURCES.MAIL)} setState={(v) => handleChangeState(SOURCES.MAIL, v)} />
            <Checkbox name="📋️  Formulaire" state={selectedSources.includes(SOURCES.FORM)} setState={(v) => handleChangeState(SOURCES.FORM, v)} />
            <Checkbox name="🖥️  Plateforme" state={selectedSources.includes(SOURCES.PLATFORM)} setState={(v) => handleChangeState(SOURCES.PLATFORM, v)} />
            <Checkbox name="💬️  Chat" state={selectedSources.includes(SOURCES.CHAT)} setState={(v) => handleChangeState(SOURCES.CHAT, v)} />
          </Popover.Panel>
        </Transition>
      </Popover>
      <div className="mt-2 grid grid-cols-1 gap-1">
        {selectedSources?.map((c) => (
          <span className=" rounded-xl bg-purple-100 px-1 text-center font-medium text-purple-800">{translateSource[c]}</span>
        ))}
      </div>
    </div>
  );
};

const DropdownContactGroup = ({ name, selectedContactGroup, setSelectedContactGroup }) => {
  const handleChangeState = (role, value) => {
    if (value) return setSelectedContactGroup([...new Set([...selectedContactGroup, role])]);
    return setSelectedContactGroup(selectedContactGroup.filter((item) => item !== role));
  };

  const Checkbox = ({ name, state, setState }) => {
    return (
      <label className="flex items-center justify-between py-2 pl-4 pr-3 transition-colors hover:bg-gray-50">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <input type="checkbox" checked={state} onChange={(e) => setState(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
      </label>
    );
  };

  return (
    <div>
      <Popover className="relative grow">
        <Popover.Button className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white py-2 pl-4 pr-3">
          <span className="text-left text-sm text-grey-text">{name}</span>
          <HiChevronDown className="text-xl text-gray-500" />
        </Popover.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Popover.Panel className="absolute z-10 mt-2 flex w-full min-w-[224px] origin-top-left flex-col rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
            {Object.keys(translateRole).map((role) => (
              <Checkbox name={translateRole[role]} state={selectedContactGroup.includes(role)} setState={(v) => handleChangeState(role, v)} />
            ))}
          </Popover.Panel>
        </Transition>
      </Popover>
      <div className="mt-2 grid grid-cols-1 gap-1">
        {selectedContactGroup.map((c) => (
          <span className=" rounded-xl bg-purple-100 px-1 text-center font-medium text-purple-800">{translateRole[c]}</span>
        ))}
      </div>
    </div>
  );
};

const DropdownAgent = ({ name, selectedAgent, setSelectedAgent, agents }) => {
  const agentUndefined = { firstName: "Non assigné", lastName: "", _id: "undefined" };

  const specificOrder = ["Réponse", "Non assigné", "Hélène", "Margaux", "Inès", "Clara", "Mathilde"];

  agents = [...agents, agentUndefined].sort((a, b) => sortAgents(specificOrder, a, b));

  const handleChangeState = (agentId, value) => {
    if (value) return setSelectedAgent([...new Set([...selectedAgent, agentId])]);
    return setSelectedAgent(selectedAgent.filter((item) => item !== agentId));
  };

  const Checkbox = ({ name, state, setState }) => {
    return (
      <label className="flex items-center justify-between py-2 pl-4 pr-3 transition-colors hover:bg-gray-50">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <input type="checkbox" checked={state} onChange={(e) => setState(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
      </label>
    );
  };

  return (
    <div>
      <Popover className="relative grow">
        <Popover.Button className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white py-2 pl-4 pr-3">
          <span className="text-left text-sm text-grey-text">{name}</span>
          <HiChevronDown className="text-xl text-gray-500" />
        </Popover.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Popover.Panel className="absolute z-10 mt-2 flex w-full min-w-[224px] origin-top-left flex-col rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
            {agents?.map((agent) => (
              <Checkbox name={`${agent.firstName} ${agent.lastName}`} state={selectedAgent.includes(agent._id)} setState={(v) => handleChangeState(agent._id, v)} />
            ))}
          </Popover.Panel>
        </Transition>
      </Popover>
      <div className="mt-2 grid grid-cols-1 gap-1">
        {selectedAgent.map((c) => (
          <span className=" rounded-xl bg-purple-100 px-1 text-center font-medium text-purple-800">
            {agents.find((agent) => agent._id === c).firstName} {agents.find((agent) => agent._id === c).lastName}
          </span>
        ))}
      </div>
    </div>
  );
};

const DropdownContactDepartment = ({ name, selectedContactDepartment, setSelectedContactDepartment, status }) => {
  const [ticketCounts, setTicketCounts] = useState({});

  const handleChangeState = (contactDepartment, value) => {
    if (value) return setSelectedContactDepartment([...new Set([...selectedContactDepartment, contactDepartment])]);

    return setSelectedContactDepartment(selectedContactDepartment.filter((item) => item !== contactDepartment));
  };

  const fetchTicketCounts = async () => {
    try {
      const response = await API.post({ path: "/ticket/search", body: { contactDepartment: Object.values(departmentLookUp) } });
      if (response.ok) {
        const { aggregations } = response;
        if (aggregations?.contactDepartment && Array.isArray(aggregations.contactDepartment)) {
          const counts = aggregations.contactDepartment.reduce((acc, item) => {
            const buckets = item.status?.buckets || [];

            if (status === "TOTREAT") {
              acc[item.key] = buckets.reduce((sum, bucket) => {
                return bucket.key !== "CLOSED" && bucket.key !== "DRAFT" ? sum + bucket.doc_count : sum;
              }, 0);
            } else {
              const statusBucket = buckets.find((bucket) => bucket.key === status);
              acc[item.key] = statusBucket ? statusBucket.doc_count : 0;
            }

            return acc;
          }, {});

          setTicketCounts(counts);
        }
      }
    } catch (error) {
      capture("Error fetching ticket counts:", error);
    }
  };

  useEffect(() => {
    fetchTicketCounts();
  }, [status]);

  const Checkbox = ({ name, state, setState }) => {
    return (
      <label className="flex items-center justify-between py-2 pl-4 pr-3 cursor-pointer transition-colors hover:bg-gray-50">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <input type="checkbox" checked={state} onChange={(e) => setState(e.target.checked)} className="h-4 w-4 cursor-pointer rounded border-gray-300 text-indigo-600" />
      </label>
    );
  };

  return (
    <div>
      <Popover className="relative grow">
        <Popover.Button className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white py-2 pl-4 pr-3">
          <span className="text-left text-sm text-grey-text">{name}</span>
          <HiChevronDown className="text-xl text-gray-500" />
        </Popover.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Popover.Panel
            className="absolute z-10 mt-2 flex w-full min-w-[224px] origin-top-left flex-col overflow-y-scroll rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5"
            style={{ height: "403px" }}
          >
            <div className="flex justify-end">
              <button
                className="p-2 text-m text-indigo-600 hover:text-indigo-300 hover:bg-gray-100 rounded-md"
                onClick={() => setSelectedContactDepartment(Object.values(departmentLookUp))}
              >
                Select All
              </button>
              <button className="p-2 text-m text-red-500 hover:text-red-300 hover:bg-gray-100 rounded-md mr-1" onClick={() => setSelectedContactDepartment([])}>
                <HiTrash />
              </button>
            </div>
            {Object.entries(departmentLookUp)
              .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
              .map(([key, value]) => (
                <Checkbox
                  key={key}
                  name={`${key} - ${value} (${ticketCounts[value] || 0})`}
                  state={selectedContactDepartment.includes(value)}
                  setState={(v) => handleChangeState(value, v)}
                />
              ))}
          </Popover.Panel>
        </Transition>
      </Popover>
      <div className="mt-2 grid grid-cols-1 gap-1" style={{ maxHeight: "110px", overflowY: "auto" }}>
        {selectedContactDepartment.map((c) => (
          <span key={c} className="rounded-xl bg-purple-100 px-1 text-center font-medium text-purple-800">
            {c} ({ticketCounts[c] || 0})
          </span>
        ))}
      </div>
    </div>
  );
};

const DropdownContactCohort = ({ name, selectedContactCohort, setSelectedContactCohort, cohortList }) => {
  const handleChangeState = (contactCohort, value) => {
    if (value) return setSelectedContactCohort([...new Set([...selectedContactCohort, contactCohort])]);

    return setSelectedContactCohort(selectedContactCohort.filter((item) => item !== contactCohort));
  };

  const Checkbox = ({ name, state, setState }) => {
    return (
      <label className="flex items-center justify-between py-2 pl-4 pr-3 transition-colors hover:bg-gray-50">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <input type="checkbox" checked={state} onChange={(e) => setState(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
      </label>
    );
  };

  return (
    <div>
      <Popover className="relative grow">
        <Popover.Button className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white py-2 pl-4 pr-3">
          <span className="text-left text-sm text-grey-text">{name}</span>
          <HiChevronDown className="text-xl text-gray-500" />
        </Popover.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Popover.Panel
            className="absolute z-10 mt-2 flex w-full min-w-[224px] origin-top-left flex-col overflow-y-scroll rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5"
            style={{ height: "403px" }}
          >
            {cohortList.map((value) => (
              <Checkbox name={value} state={selectedContactCohort.includes(value)} setState={(v) => handleChangeState(value, v)} />
            ))}
          </Popover.Panel>
        </Transition>
      </Popover>
      <div className="mt-2 grid grid-cols-1 gap-1">
        {selectedContactCohort.map((c) => (
          <span className=" rounded-xl bg-purple-100 px-1 text-center font-medium text-purple-800">{c}</span>
        ))}
      </div>
    </div>
  );
};

const DropdownParcours = ({ name, selectedParcours, setSelectedParcours }) => {
  const handleChangeState = (parcours, value) => {
    if (value) return setSelectedParcours([...new Set([...selectedParcours, parcours])]);

    return setSelectedParcours(selectedParcours.filter((item) => item !== parcours));
  };

  const Checkbox = ({ name, state, setState }) => {
    return (
      <label className="flex items-center justify-between py-2 pl-4 pr-3 transition-colors hover:bg-gray-50">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <input type="checkbox" checked={state} onChange={(e) => setState(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
      </label>
    );
  };

  return (
    <div>
      <Popover className="relative grow">
        <Popover.Button className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white py-2 pl-4 pr-3">
          <span className="text-left text-sm text-grey-text">{name}</span>
          <HiChevronDown className="text-xl text-gray-500" />
        </Popover.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Popover.Panel
            className="absolute z-10 mt-2 flex w-full min-w-[224px] origin-top-left flex-col overflow-y-scroll rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5"
            style={{ height: "80px" }}
          >
            {Object.entries(PARCOURSLIST).map(([key, value]) => (
              <Checkbox name={value === "VOLONTAIRE" ? "HTS" : value} state={selectedParcours?.includes(value)} setState={(v) => handleChangeState(value, v)} />
            ))}
          </Popover.Panel>
        </Transition>
      </Popover>
      <div className="mt-2 grid grid-cols-1 gap-1">
        {selectedParcours?.map((c) => (
          <span className=" rounded-xl bg-purple-100 px-1 text-center font-medium text-purple-800">{c === "VOLONTAIRE" ? "HTS" : c}</span>
        ))}
      </div>
    </div>
  );
};

const AutoCompleteContact = ({ value, onChange }) => {
  const [input, setInput] = useState(value);
  const [options, setOptions] = useState([]);
  const arrowUpPressed = useKeyPress("ArrowUp");
  const arrowDownPressed = useKeyPress("ArrowDown");
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (arrowUpPressed) {
      selected > 0 ? setSelected(selected - 1) : 0;
      console.log("arrowUpPressed");
    }
  }, [arrowUpPressed]);

  useEffect(() => {
    if (arrowDownPressed) {
      selected < options.length - 1 && selected < 4 ? setSelected(selected + 1) : 0;
      console.log("arrowDownPressed");
    }
  }, [arrowDownPressed]);

  useEffect(() => {
    getOptions(input);
  }, [input]);

  const getOptions = async (q) => {
    try {
      const { ok, data, code } = await API.get({ path: "/contact/search", query: { q } });
      if (!ok) return toast.error(code);
      setOptions(data);
    } catch (e) {
      console.log(e.message);
    }
  };

  return (
    <div>
      <div className="mb-2 flex divide-x divide-gray-300 overflow-hidden rounded-md border border-gray-300">
        <input
          onClick={() => setInput("")}
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          className="w-32 flex-1 border-0 text-sm text-gray-600 placeholder:text-[#979797] focus:border-transparent"
          placeholder="Contact"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onChange(options[selected]._id);
              setInput(`${options[selected].firstName} ${options[selected].lastName}`);
              setOptions([]);
            }
          }}
        />
      </div>
      <ul className="mb-2  text-sm text-gray-600 ">
        {options.slice(0, 5)?.map((option, index) => (
          <li
            className={`cursor-pointer hover:bg-gray-50 ${index === selected ? "bg-gray-200 text-purple-800" : ""}`}
            key={index}
            onClick={() => {
              onChange(option._id);
              setInput(`${option.firstName} ${option.lastName}`);
              setOptions([]);
            }}
          >
            {option.firstName} {option.lastName}
          </li>
        ))}
      </ul>
    </div>
  );
};

const AutoCompleteTags = ({ value, onChange }) => {
  const [input, setInput] = useState(value);
  const [options, setOptions] = useState([]);
  const arrowUpPressed = useKeyPress("ArrowUp");
  const arrowDownPressed = useKeyPress("ArrowDown");
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (arrowUpPressed) {
      selected > 0 ? setSelected(selected - 1) : 0;
      console.log("arrowUpPressed");
    }
  }, [arrowUpPressed]);

  useEffect(() => {
    if (arrowDownPressed) {
      selected < options.length - 1 && selected < 4 ? setSelected(selected + 1) : 0;
      console.log("arrowDownPressed");
    }
  }, [arrowDownPressed]);

  useEffect(() => {
    if (input) getOptions(input);
    else setOptions([]);
  }, [input]);

  const getOptions = async (q) => {
    try {
      const { ok, data, code } = await API.get({ path: "/tag/search", query: { q } });
      if (!ok) return toast.error(code);
      const filteredData = data.filter((option) => option.userVisibility !== "OLD");
      setOptions(filteredData);
    } catch (e) {
      capture(e);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center divide-x divide-gray-300 overflow-hidden rounded-md border border-gray-300 text-center">
        <input
          onClick={() => setInput("")}
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          className="w-32 flex-1 border-0 text-sm text-gray-600 placeholder:text-[#979797] focus:border-transparent"
          placeholder="Tag"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onChange(options[selected]._id);
              setInput(`${options[selected].name}`);
              setOptions([]);
            }
          }}
        />
        <IoStopCircle
          className="right-2 cursor-pointer text-xl text-snu-purple-300  hover:text-gray-800"
          onClick={() => {
            onChange("null");
            setInput("Vide");
          }}
        />
      </div>
      <ul className="mb-4  text-sm text-gray-600 ">
        {options.slice(0, 5).map((option, index) => (
          <li
            className={`cursor-pointer hover:bg-gray-50 ${index === selected ? "bg-gray-200 text-purple-800" : ""}`}
            key={index}
            onClick={() => {
              onChange(option._id);
              setInput(`${option.name}`);
              setOptions([]);
            }}
          >
            {option.name}
          </li>
        ))}
      </ul>
    </div>
  );
};
const SearchBar = ({ value, onChange }) => {
  const [input, setInput] = useState(value);
  const [options, setOptions] = useState([]);
  const [searched, setSearched] = useState(false);
  const arrowUpPressed = useKeyPress("ArrowUp");
  const arrowDownPressed = useKeyPress("ArrowDown");
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (arrowUpPressed) {
      selected > 0 ? setSelected(selected - 1) : 0;
      console.log("arrowUpPressed");
    }
  }, [arrowUpPressed]);

  useEffect(() => {
    if (arrowDownPressed) {
      selected < options.length - 1 && selected < 4 ? setSelected(selected + 1) : 0;
      console.log("arrowDownPressed");
    }
  }, [arrowDownPressed]);

  useEffect(() => {
    if (input) getOptions(input);
  }, [input]);

  const getOptions = async (q) => {
    if (!searched) {
      try {
        const { ok, data, code } = await API.get({ path: "/ticket/searchAll", query: { q } });
        if (!ok) return toast.error(code);
        setOptions(data);
      } catch (e) {
        console.log(e.message);
      }
    }
  };

  // TO DO changer format d'import des dates
  const resultat = (o) => {
    let result = "";
    switch (o.status) {
      case "CLOSED":
        result += "🟢";
        break;
      case "NEW":
        result += "🔴";
        break;
      case "OPEN":
        result += "🟠";
        break;
      default:
        result += "🔵";
        break;
    }
    result += " " + sourceToIcon[o.source] + " " + o.subject + " - " + o.contactFirstName + " " + o.contactLastName;
    //role emetteur
    result += " #" + o.number + " " + o.createdAt.slice(8, 10) + "/" + o.createdAt.slice(5, 7) + "/" + o.createdAt.slice(0, 4);
    o.agentFirstName ? (result += " [" + o.agentFirstName + "]") : 0;
    return result;
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex w-full divide-x divide-gray-300 overflow-hidden rounded-md border border-gray-300">
        <input
          onClick={() => {
            setInput("");
            setSearched(false);
          }}
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          className="w-full flex-1 border-0 text-sm text-gray-600 placeholder:text-[#979797] focus:border-transparent"
          placeholder="Entrez votre recherche ..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onChange(options[selected]._id);
              setInput(`${options[selected].subject} --- ${options[selected].contactFirstName} ${options[selected].contactLastName}`);
              setOptions([]);
              setSearched(true);
            }
          }}
        />
      </div>
      <ul className="mb-4  text-sm text-gray-600 ">
        {options?.slice(0, 9).map((option, index) => (
          <li
            className={`cursor-pointer hover:bg-gray-50 ${index === selected ? "bg-gray-200 text-purple-800" : ""}`}
            key={index}
            onClick={() => {
              onChange(option._id);
              setInput(`${option.subject} --- ${option.contactFirstName} ${option.contactLastName}`);
              setOptions([]);
              setSearched(true);
            }}
          >
            {resultat(option)}
          </li>
        ))}
      </ul>
    </div>
  );
};

const SelectAll = ({ tickets, selectedTicket, setSelectedTicket }) => {
  return (
    <div className="items-center">
      <input
        type="checkbox"
        className="h-[37px] w-[37px]  rounded border-gray-300 text-indigo-600"
        checked={selectedTicket.length !== 0 && tickets.length === selectedTicket.length}
        onChange={(e) => {
          e.stopPropagation();
          if (tickets.length === selectedTicket.length) {
            setSelectedTicket([]);
          } else {
            setSelectedTicket(tickets.map((ticket) => ticket._id));
          }
        }}
      />
    </div>
  );
};
