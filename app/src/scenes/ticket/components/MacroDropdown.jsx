import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import DropdownButton from "../../../components/DropdownButton";
import API from "../../../services/api";

export default function MacroDropdown({ selectedTicket, onClose, onRefresh, handleAddMessage }) {
  const [macros, setMacros] = useState([]);

  const user = useSelector((state) => state.Auth.user);
  useEffect(() => {
    getMacro();
  }, []);

  async function getMacro() {
    try {
      const res = await API.get({
        path: "/macro",
        query: {
          isActive: true,
        },
      });
      if (!res.ok) return toast.error(res.code);
      setMacros(res.data);
    } catch (e) {
      return toast.error(e, "Erreur lors de la récupération des macros");
    }
  }

  async function useMacro(macro) {
    try {
      if (selectedTicket.length === 0) return toast.error("Veuillez sélectionner au moins un ticket avant d'appliquer une macro");
      // if macro is applied to one ticket, send current message
      if (macro.sendCurrentMessage && handleAddMessage) {
        await handleAddMessage();
      }
      const res = await API.post({ path: `/macro/${macro._id}`, body: { ticketsId: selectedTicket, agentId: user._id } });
      if (!res.ok) return toast.error(res.code);
      toast.success("La macro a bien été appliquée.");
      // redirects to ticket list (inbox) or closes preview
      if (macro.stayOnCurrentPage) {
        await onRefresh();
      } else {
        await onClose();
      }
    } catch (e) {
      return toast.error(e, "Erreur lors de l'application de la macro'");
    }
  }

  return macros.map((macro) => <DropdownButton name={macro?.name} handleClick={() => useMacro(macro)} />);
}
