// Data service for Campus Maintenance Requests.
// Activity 6: records are stored as JSON in localStorage.
// Activity 8: these same methods will call the backend instead.

const KEY = "maintenance-demo-v1";

const SEED_RECORDS = [
  { id: 1, title: "Broken classroom light", category: "Electrical", description: "The light in Room B12 does not switch on.", status: "Pending" },
  { id: 2, title: "Leaking tap in washroom", category: "Plumbing", description: "The cold water tap in the ground floor washroom drips constantly.", status: "In progress" },
  { id: 3, title: "Wobbly library chair", category: "Furniture", description: "A chair in the reading room has a loose leg and tilts when sat on.", status: "Pending" },
  { id: 4, title: "Flickering corridor light", category: "Electrical", description: "The light outside the Engineering lab flickers every few minutes.", status: "Completed" },
  { id: 5, title: "Blocked sink in kitchen", category: "Plumbing", description: "Water drains very slowly from the sink in the staff kitchen.", status: "In progress" },
  { id: 6, title: "Broken desk drawer", category: "Furniture", description: "The top drawer of the desk in Office 204 will not open fully.", status: "Pending" },
  { id: 7, title: "Socket sparking in lab", category: "Electrical", description: "A wall socket in Computer Lab 2 makes a crackling sound when used.", status: "Completed" },
  { id: 8, title: "Toilet cistern running", category: "Plumbing", description: "The toilet in block C keeps refilling and the water never stops.", status: "Pending" },
  { id: 9, title: "Damaged lecture hall seat", category: "Furniture", description: "Seat 14 in Lecture Hall A has a cracked base and is unsafe to use.", status: "In progress" },
  { id: 10, title: "Dim lights in library", category: "Electrical", description: "Half of the ceiling lights on the second floor of the library are not working.", status: "Pending" }
];

function clone(list) {
  return JSON.parse(JSON.stringify(list));
}

function saveAll(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function readAll() {
  // Add starting records only when the key does not exist yet.
  // An existing empty array stays empty after a refresh.
  if (localStorage.getItem(KEY) === null) {
    saveAll(clone(SEED_RECORDS));
  }
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error("Saved data could not be read. Clear this site's localStorage and reload.");
  }
}

function nextId(list) {
  // Never reuse an id: take the highest existing id and add one.
  const highest = list.reduce((max, record) => Math.max(max, record.id), 0);
  return highest + 1;
}

export const recordService = {
  async list() {
    return readAll();
  },

  async get(id) {
    const record = readAll().find((item) => item.id === id);
    if (!record) {
      throw new Error("That request could not be found. It may have been deleted.");
    }
    return record;
  },

  async create(record) {
    const list = readAll();
    const newRecord = {
      id: nextId(list),
      title: record.title,
      category: record.category,
      description: record.description,
      status: record.status
    };
    list.push(newRecord);
    saveAll(list);
    return newRecord;
  },

  async update(id, record) {
    const list = readAll();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error("That request could not be found. It may have been deleted.");
    }
    // Replace the four editable fields only. The id stays the same.
    list[index] = {
      id: list[index].id,
      title: record.title,
      category: record.category,
      description: record.description,
      status: record.status
    };
    saveAll(list);
    return list[index];
  },

  async remove(id) {
    const list = readAll();
    const remaining = list.filter((item) => item.id !== id);
    if (remaining.length === list.length) {
      throw new Error("That request could not be found. It may have been deleted.");
    }
    saveAll(remaining);
    return { success: true, message: "Request deleted." };
  }
};
