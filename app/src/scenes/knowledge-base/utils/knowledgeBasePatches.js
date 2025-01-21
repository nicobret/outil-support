function createEvent(op, e, value, originalValue) {
  let event = {};
  event.author = `${e.user?.firstName} ${e.user?.lastName}`;
  event.email = e.user?.email;
  event.date = e.date;
  event.value = value;
  event.originalValue = originalValue;
  event.field = op.path.split("/")[1];
  event.action = translateEvent(event.field, value, originalValue);
  return event;
}

function translateEvent(field, value, originalValue) {
  if (field === "contentUpdatedAt") {
    return "a mis à jour l'artice";
  }
  if (field === "allowedRoles") {
    return "a mis à jour la visibilité par";
  }
  if (field === "slug") {
    return `a mis à jour l'url : \n${originalValue} -> ${value}`;
  }
  if (field === "keywords") {
    return `a mis à jour les mots clés : \n${originalValue} -> ${value}`;
  }
  if (field === "description") {
    return `a mis à jour la description : \n${originalValue} -> ${value}`;
  }
  if (field === "title") {
    return `a mis à jour le titre : \n${originalValue} -> ${value}`;
  }
  if (field === "status") {
    switch (value) {
      case "PUBLISHED":
        return "a publié l'article";
      case "DRAFT":
        return "a mis article dans les brouillons";
      case "ARCHIVED":
        return "a archivé l'article";
      default:
        return `a mis à jour le statut : \n${originalValue} -> ${value}`;
    }
  }
  return `${field} : \n${originalValue} -> ${value}`;
}

export const formatHistory = (data) => {
  const history = [];
  for (const e of data) {
    const currentOpsEvents = [];
    for (const op of e.ops) {
      const newEvent = createEvent(op, e, op.value, op.originalValue);
      const alreadyAddedEvent = currentOpsEvents.find((event) => event.field === newEvent.field);
      // in case of an array update many events are created, we only need to display one (field concerned: allowedRoles)
      if (!alreadyAddedEvent) {
        currentOpsEvents.push(newEvent);
        history.push(newEvent);
      }
    }
  }
  return history;
};
