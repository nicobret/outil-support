import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { HiExternalLink, HiOutlineChatAlt2, HiOutlineChat, HiOutlineDesktopComputer, HiOutlineClipboardList, HiOutlineMail } from "react-icons/hi";
import { LiaHistorySolid } from "react-icons/lia";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import DeleteTicketModal from "../components/DeleteTicketModal";
import TicketAgentDropdownButton from "../components/TicketAgentDropdownButton";
import TicketPreviewContainer from "../components/TicketPreviewContainer";
import ReactTooltip from "react-tooltip";

import plausibleEvent from "../../../services/plausible";

import Pagination from "../../../components/Pagination";

import { getStatusColor, sourceToIcon, translateRole, translateState, translateParcours, getDotColorClass, formatTicketDate } from "../../../utils";
import Header from "./Header";
import SideBar from "./SideBar";

import { setOrganisation, setUser } from "../../../redux/auth/actions";

import API from "../../../services/api";
import { addTicket } from "../../../redux/ticketPreview/actions";
import { appURL } from "../../../config";

export default function Home() {
  const [tickets, setTickets] = useState([]);
  const [aggregations, setAggregation] = useState([]);
  const [total, setTotal] = useState(0);
  const [agents, setAgents] = useState([]);
  const [referentsDepartment, setReferentsDepartment] = useState([]);
  const [referentsRegion, setReferentsRegion] = useState([]);
  const user = useSelector((state) => state.Auth.user);
  const dispatch = useDispatch();
  const [filter, setFilter] = useState({
    page: 1,
    status: "TOTREAT",
    sources: new URLSearchParams(window.location.search).get("source") ? [new URLSearchParams(window.location.search).get("source")] : [],
    agent: [],
    agentId: "",
    contactId: "",
    contactDepartment: [],
    contactCohort: [],
    parcours: [],
    folderId: "",
    sorting: "",
    ticketId: "",
    tag: new URLSearchParams(window.location.search).get("tagId") || "",
    contactGroup: [],
    size: 30,
    advancedSearch: new URLSearchParams(window.location.search).get("advancedSearch") || "",
  });
  const [selectedTicket, setSelectedTicket] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await update(filter);
      } catch (error) {
        toast.error("Erreur lors de la récupération des données");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const refresh = setInterval(async () => {
      try {
        const res = await API.post({ path: "/ticket/search", body: filter });
        if (res.status === 401) {
          dispatch(setUser(null));
          dispatch(setOrganisation(null));
          API.setToken("");
          return;
        }
        if (!res.ok) return toast.error("Veuillez rafraîchir la page");
        setTickets(res.data);
        setTotal(res.total);
        setAggregation(res.aggregations);
      } catch (e) {
        return toast.error(e, "Erreur lors de la récupération des tickets");
      }
    }, 1000 * 60);
    return () => clearInterval(refresh);
  }, [filter]);

  const getAgents = async () => {
    try {
      const { ok, data } = await API.get({ path: `/agent/` });
      if (ok) {
        setAgents(data.AGENT);
        setReferentsDepartment(data.REFERENT_DEPARTMENT);
        setReferentsRegion(data.REFERENT_REGION);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const openTicketPreview = async (ticket) => {
    try {
      const { ok, data, code } = await API.get({ path: `/ticket/${ticket._id}` });
      if (!ok) return toast.error(code);
      const messageReponse = await API.get({ path: "/message", query: { ticketId: ticket._id } });
      if (!messageReponse.ok) return toast.error(code);
      const storedTicket = { ticket: data.ticket, tags: data.tags, messages: messageReponse.data };
      if (user.role === "AGENT") {
        const signatureResponse = await API.get({ path: `/shortcut`, query: { signatureDest: data.ticket.contactGroup } });
        dispatch(addTicket({ ...storedTicket, signature: signatureResponse.data?.content }));
      } else {
        dispatch(addTicket(storedTicket));
      }
    } catch (e) {
      toast.error("Une error est survenue");
    }
  };

  async function update(f) {
    try {
      const body = f;
      const res = await API.post({ path: "/ticket/search", body });
      if (res.status === 401) {
        dispatch(setUser(null));
        dispatch(setOrganisation(null));
        API.setToken("");
        return;
      }
      if (!res.ok) return toast.error("Veuillez rafraîchir la page");
      setTickets(res.data);
      setTotal(res.total);
      setAggregation(res.aggregations);
      setFilter(f);
      await getAgents();
    } catch (e) {
      return toast.error(e, "Erreur lors de la récupération des tickets");
    }
  }

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {user?.role === "AGENT" && <TicketPreviewContainer filter={filter} update={update} />}
      <SideBar filter={filter} aggregations={aggregations} update={update} />
      <div className="flex flex-1 flex-col justify-between gap-6 overflow-y-auto p-[22px] pb-0 ">
        <div className="flex h-max flex-col rounded-lg bg-white pt-[30px] pb-[50px] shadow-block">
          <Header
            filter={filter}
            aggregations={aggregations}
            update={update}
            selectedTicket={selectedTicket}
            tickets={tickets}
            setSelectedTicket={setSelectedTicket}
            user={user}
            advancedSearch={!!filter.advancedSearch}
            agents={agents}
          />
          <div className="pb-5 pr-5">
            <Pagination
              className="pr-6 pl-[52px]"
              total={total}
              currentPage={filter.page}
              range={filter.size}
              onPageChange={(page) => update({ ...filter, page })}
              onSizeChange={(size) => update({ ...filter, size })}
            />
          </div>
          <Table
            openTicketPreview={openTicketPreview}
            tickets={tickets}
            update={update}
            filter={filter}
            selectedTicket={selectedTicket}
            setSelectedTicket={setSelectedTicket}
            agents={agents}
            referentsDepartment={referentsDepartment}
            referentsRegion={referentsRegion}
            user={user}
          />
          <Pagination
            className="pr-6 pl-[52px]"
            total={total}
            currentPage={filter.page}
            range={filter.size}
            onPageChange={(page) => update({ ...filter, page })}
            onSizeChange={(size) => update({ ...filter, size })}
          />
        </div>
      </div>
    </div>
  );
}

const Table = ({ tickets, update, filter, selectedTicket, setSelectedTicket, agents, referentsDepartment, referentsRegion, user, openTicketPreview }) => {
  return (
    <div className="mb-[42px] flex flex-col divide-y divide-gray-200 border-t border-b border-gray-200">
      {tickets.map((ticket) => (
        <TableItem
          key={ticket._id}
          ticket={ticket}
          update={update}
          filter={filter}
          selectedTicket={selectedTicket}
          setSelectedTicket={setSelectedTicket}
          agents={agents}
          referentsRegion={referentsRegion}
          referentsDepartment={referentsDepartment}
          user={user}
          openTicketPreview={openTicketPreview}
        />
      ))}
    </div>
  );
};

const TableItem = ({ ticket, update, filter, selectedTicket, setSelectedTicket, agents, referentsDepartment, referentsRegion, user, openTicketPreview }) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const creationDate = new Date(ticket.createdAt);
  const hourDate = ("0" + creationDate.getHours()).slice(-2) + ":" + ("0" + creationDate.getMinutes()).slice(-2);

  const sourceToReactIcon = {
    MAIL: { icon: <HiOutlineMail />, color: "#d97706" },
    FORM: { icon: <HiOutlineClipboardList />, color: "#059669" },
    PLATFORM: { icon: <HiOutlineDesktopComputer />, color: "#ec4899" },
    CHAT: { icon: <HiOutlineChat />, color: "black" },
  };

  const history = useHistory();
  const lastActivity = useMemo(() => {
    const lastMessageDate = new Date(ticket.updatedAt);
    if (
      lastMessageDate.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }) ===
      new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
    ) {
      return ("0" + lastMessageDate.getHours()).slice(-2) + ":" + ("0" + lastMessageDate.getMinutes()).slice(-2);
    }
    const difference = Math.abs(new Date() - lastMessageDate);
    return Math.ceil(difference / (1000 * 60 * 60 * 24)) === 1
      ? +Math.ceil(difference / (1000 * 60 * 60 * 24)) + " jour"
      : Math.ceil(difference / (1000 * 60 * 60 * 24)) + " jours";
  }, [ticket._id]);

  const startDrag = (ev) => ev.dataTransfer.setData("drag-item", ticket._id);

  return (
    <div
      draggable
      onDragStart={startDrag}
      className="grid cursor-pointer grid-cols-[20px_85px_1fr_225px_160px_20px_20px_20px] items-center gap-5 py-4 px-4 odd:bg-white even:bg-[#F9FAFB] pl-10"
    >
      <div>
        {user.role === "AGENT" && (
          <input
            type="checkbox"
            className="h-6 w-6 rounded border-gray-300 text-indigo-600"
            checked={selectedTicket?.includes(ticket._id)}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              if (selectedTicket?.includes(ticket._id)) setSelectedTicket(selectedTicket?.filter((t) => ticket._id !== t));
              else setSelectedTicket([...selectedTicket, ticket._id]);
            }}
          />
        )}
      </div>
      <div className="flex flex-col gap-2.5">
        <span className={`rounded-full px-2.5 py-0.5 text-center text-xs font-medium ${getStatusColor(ticket.status)}`}>#{ticket.number}</span>
      </div>
      <div onClick={() => history.push(`/ticket/${ticket._id}`)}>
        <h6 className="mb-2 text-gray-500">
          <span className="font-bold text-gray-900 mr-2 ">{ticket.contactFirstName ? ticket.contactFirstName + " " + ticket.contactLastName : ticket.contactEmail}</span>{" "}
          <span className="border border-gray-200 rounded-xl bg-gray-100 px-2 py-1  text-gray-900 text-sm">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${getDotColorClass(ticket?.contactGroup, ticket?.parcours)} mr-1`}></span>
            {ticket?.parcours ? `${translateRole[ticket?.contactGroup]} ${translateParcours[ticket?.parcours]}` : translateRole[ticket?.contactGroup]}
          </span>
        </h6>
        <p className="text-gray-500 line-clamp-1">
          <span className="font-semibold">{ticket.type}</span> <span className="font-medium">{ticket.subject}</span>
        </p>
      </div>
      <div>
        <div className={` flex flex-col  items-start  ${user.role === "DG" && "opacity-50 pointer-events-none"}`}>
          {user.role === "AGENT" && (
            <TicketAgentDropdownButton
              ticket={ticket}
              selectedTicket={selectedTicket}
              setSelectedTicket={setSelectedTicket}
              setTicket={() => {
                update(filter);
                plausibleEvent("List Tickets/CTA - Change agent");
              }}
              agents={agents}
              role={"AGENT"}
            />
          )}
          {(user.role === "AGENT" || user.role === "REFERENT_REGION") && (
            <TicketAgentDropdownButton
              ticket={ticket}
              selectedTicket={selectedTicket}
              setSelectedTicket={setSelectedTicket}
              setTicket={() => {
                update(filter);
                plausibleEvent("List Tickets/CTA - Change Referent region");
              }}
              agents={referentsRegion}
              role={"REFERENT_REGION"}
            />
          )}
          <TicketAgentDropdownButton
            ticket={ticket}
            selectedTicket={selectedTicket}
            setSelectedTicket={setSelectedTicket}
            setTicket={() => {
              update(filter);
              plausibleEvent("List Tickets/CTA - Change Referent department");
            }}
            agents={referentsDepartment}
            role={"REFERENT_DEPARTMENT"}
          />
        </div>
      </div>
      <div>
        <div className="mb-1 flex items-center gap-1.5">
          <span
            className="text-2xl"
            style={{ color: ticket.source && sourceToReactIcon[ticket.source] ? sourceToReactIcon[ticket.source].color : "inherit" }}
            data-tip="Date de création"
            data-for="createdAt-tooltip"
          >
            {ticket.source && sourceToReactIcon[ticket.source] ? sourceToReactIcon[ticket.source].icon : ""}
          </span>
          <ReactTooltip id="createdAt-tooltip" type="dark" place="top" effect="solid" className="custom-tooltip-radius !shadow-sm !text-white !text-xs !font-medium" />

          <span className="text-sm text-gray-900 ml-0.5">{formatTicketDate(ticket?.createdAt)}</span>
        </div>
        <div className="flex items-center text-2xl mb-1 text-gray-400">
          <LiaHistorySolid data-tip="Dernière activité" data-for="lastActivity-tooltip" />
          <ReactTooltip id="lastActivity-tooltip" type="dark" place="top" effect="solid" className="custom-tooltip-radius !shadow-sm !text-white !text-xs !font-medium" />
          <span className="text-sm text-gray-900 ml-2">{lastActivity}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-6 h-6 bg-gray-100 flex justify-center items-center rounded-full text-sm font-medium mr-1">{ticket.messageCount}</span>
          <span className="text-gray-900 text-sm">message{ticket.messageCount > 1 && "s"}</span>
        </div>
      </div>
      <div className="flex w-24">
        {user.role === "AGENT" && (
          <button
            onClick={(e) => {
              plausibleEvent("List Tickets/CTA - Open preview");
              openTicketPreview(ticket);
            }}
            className="bg-gray-100 rounded-full p-2 inline-flex items-center justify-center  mr-3"
            style={{ width: "40px", height: "40px" }}
            data-tip="Vue réduite"
            data-for="reducedView-tooltip"
          >
            <HiOutlineChatAlt2 className="text-xl text-gray-500" />
            <ReactTooltip id="reducedView-tooltip" type="dark" place="top" effect="solid" className="custom-tooltip-radius !shadow-sm !text-white !text-xs !font-medium" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            plausibleEvent("List Tickets/CTA - Open in window");
            window.open(`${appURL}/ticket/${ticket._id}`, "_blank");
          }}
          className="bg-gray-100 rounded-full p-2 inline-flex items-center justify-center"
          style={{ width: "40px", height: "40px" }}
          data-tip="Nouvel onglet"
          data-for="newTab-tooltip"
        >
          <HiExternalLink className="text-xl text-gray-500" />
        </button>
        <ReactTooltip id="newTab-tooltip" type="dark" place="top" effect="solid" className="custom-tooltip-radius !shadow-sm !text-white !text-xs !font-medium" />
      </div>
      {/* {user.role === "AGENT" && (
        <DeleteTicketModal
          open={deleteModalOpen}
          setOpen={setDeleteModalOpen}
          ticket={ticket}
          update={update}
          filter={filter}
          onClick={(e) => {
            e.stopPropagation();
            plausibleEvent("List Tickets/CTA - Delete ticket open modal");
            setDeleteModalOpen(true);
          }}
        />
      )} */}
    </div>
  );
};
