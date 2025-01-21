import { Menu, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import toast from "react-hot-toast";
import { sortAgents } from "../../../utils";
import { HiChevronDown, HiUser, HiUserGroup, HiUsers, HiCheck } from "react-icons/hi";
import API from "../../../services/api";

export default function DropdownButton({ setTicket, ticket, selectedTicket, setSelectedTicket, agents, role }) {
  const specificOrder = ["Réponse", "Hélène", "Margaux", "Inès", "Clara", "Mathilde"];

  const sortedAgents = agents.sort((a, b) => sortAgents(specificOrder, a, b));

  const handleChangeAgent = async (agent) => {
    try {
      let body = {};
      if (role === "AGENT") {
        body.agentFirstName = agent.firstName;
        body.agentLastName = agent.lastName;
        body.agentEmail = agent.email;
        body.agentId = agent._id;
      } else if (role === "REFERENT_DEPARTMENT") {
        body.referentDepartmentFirstName = agent.firstName;
        body.referentDepartmentLastName = agent.lastName;
        body.referentDepartmentEmail = agent.email;
        body.referentDepartmentId = agent._id;
      } else if (role === "REFERENT_REGION") {
        body.referentRegionFirstName = agent.firstName;
        body.referentRegionLastName = agent.lastName;
        body.referentRegionEmail = agent.email;
        body.referentRegionId = agent._id;
      }
      if (selectedTicket?.length) {
        for (let ticketId of selectedTicket) {
          const { ok, data } = await API.put({
            path: `/ticket/${ticketId}`,
            body,
          });
          if (!ok) return toast.error("Erreur lors de la mise à jour de l'agent");
          setTicket(data.ticket);
          toast.success("Agent modifié");
        }
      } else {
        const { ok, data } = await API.put({
          path: `/ticket/${ticket._id}`,
          body,
        });
        if (!ok) return toast.error("Erreur lors de la mise à jour de l'agent");
        setTicket(data.ticket);
        toast.success("Agent modifié");
      }
      setSelectedTicket([]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Menu as="div" className="relative mr-10 flex flex-col">
      <Menu.Button className="flex items-center text-gray-400">
        {role === "AGENT" && (
          <div className="flex w-full items-center mb-1">
            <span className="flex-none text-left text-xs text-gray-600">Agent</span>
            <div className="flex-grow flex items-center justify-between border border-gray-200 rounded h-7 p-1 ml-[9px] w-44">
              <span className="ml-0.5 truncate text-sm text-gray-900">
                {ticket?.agentFirstName} {ticket?.agentLastName}
              </span>
              <HiChevronDown className="text-xl" />
            </div>
          </div>
        )}
        {role === "REFERENT_REGION" && (
          <div className="flex w-full items-center mb-1">
            <span className="text-left text-xs text-gray-600">Région</span>
            <div className="flex-grow flex items-center justify-between border border-gray-200 rounded h-7 p-1 ml-1 w-44">
              <span className="ml-0.5 truncate text-sm text-gray-900">
                {ticket?.referentRegionFirstName} {ticket?.referentRegionLastName}
              </span>
              <HiChevronDown className="text-xl" />
            </div>
          </div>
        )}
        {role === "REFERENT_DEPARTMENT" && (
          <div className="flex w-full items-center mb-1">
            <span className="text-left text-xs text-gray-600">Dépt</span>
            <div className="flex-grow flex items-center justify-between border border-gray-200 rounded h-7 p-1 ml-4 w-44">
              <span className="ml-0.5 truncate text-sm text-gray-900">
                {ticket?.referentDepartmentFirstName} {ticket?.referentDepartmentLastName}
              </span>
              <HiChevronDown className="text-xl" />
            </div>
          </div>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-1/2 z-10 mt-4 flex w-56 origin-top -translate-x-1/2 flex-col rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {sortedAgents
            .filter(
              (agent) =>
                agent.firstName &&
                agent.lastName &&
                (role === "AGENT" ||
                  (role === "REFERENT_DEPARTMENT" && agent.departments.includes(ticket.contactDepartment)) ||
                  (role === "REFERENT_REGION" && agent.region === ticket.contactRegion))
            )
            .map((agent) => {
              // Determine if the agent is the selected agent
              const isSelected = ticket?.agentId === agent._id || ticket?.referentDepartmentId === agent._id || ticket?.referentRegionId === agent._id;

              return (
                <Menu.Item key={agent._id}>
                  <button
                    type="button"
                    className={`py-2 px-4 text-left text-sm transition-colors hover:bg-gray-50 flex justify-between items-center ${
                      isSelected ? "text-gray-900 font-bold" : "text-gray-700"
                    }`}
                    onClick={(e) => {
                      handleChangeAgent(agent);
                      e.stopPropagation();
                    }}
                  >
                    {agent.firstName} {agent.lastName}
                    {/* Conditionally render the check mark */}
                    {isSelected && <HiCheck className="ml-2 text-blue-600" />}
                  </button>
                </Menu.Item>
              );
            })}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
