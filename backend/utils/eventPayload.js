const normalizeEventPayload = (payload = {}) => {
  const date = payload.date || payload.startDateTime;
  const endDate = payload.endDate || payload.endDateTime || payload.date || payload.startDateTime;
  const venue = payload.venue || payload.venueName;
  const capacity = payload.capacity || payload.capacityLimit;

  return {
    title: payload.title,
    description: payload.description,
    date,
    endDate,
    venue,
    buildingName: payload.buildingName || '',
    category: payload.category,
    capacity,
    registrationDeadline: payload.registrationDeadline || date,
    status: payload.status,
    guestSpeaker: payload.guestSpeaker,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    prerequisites: payload.prerequisites,
    contactEmail: payload.contactEmail,
    contactPhone: payload.contactPhone,
  };
};

module.exports = { normalizeEventPayload };
