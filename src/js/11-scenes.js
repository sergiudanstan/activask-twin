// ================================================================ scenes and instruction pools (Sec. 4.1)
// Twin-assumed scene set: 36 offline scenes (9 per family, objects as in the paper's protocol description)
// and 20 online scenes (5 per family). Objects carry no x/y/yaw: layoutScene places them. Material realism:
// ceramic or paper cups (paper: no handle), glass or plastic bottles, metal or plastic utensils. Same-category
// objects always differ in at least one visible attribute and often share one, so partial instructions exist.
// 56 scenes, 336 instructions (2 clear + 2 partial + 2 ambiguous per scene).
const SCENES = [
  { id: "off-cups-01", set: "offline", family: "cups", objects: [
    { id: "o1", cat: "cup", color: "orange", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "white", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "blue", size: "small", material: "paper", handle: false, lid: true },
    { id: "o4", cat: "cup", color: "orange", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o5", cat: "cup", color: "yellow", size: "small", material: "paper", handle: false, lid: false },
    { id: "o6", cat: "cup", color: "green", size: "medium", material: "paper", handle: false, lid: false }
  ] },
  { id: "off-cups-02", set: "offline", family: "cups", objects: [
    { id: "o1", cat: "cup", color: "red", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "red", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "white", size: "small", material: "paper", handle: false, lid: true },
    { id: "o4", cat: "cup", color: "blue", size: "medium", material: "paper", handle: false, lid: false },
    { id: "o5", cat: "cup", color: "white", size: "medium", material: "paper", handle: false, lid: false },
    { id: "o6", cat: "cup", color: "pink", size: "small", material: "ceramic", handle: true, lid: false }
  ] },
  { id: "off-cups-03", set: "offline", family: "cups", objects: [
    { id: "o1", cat: "cup", color: "green", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "green", size: "small", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "yellow", size: "medium", material: "paper", handle: false, lid: true },
    { id: "o4", cat: "cup", color: "black", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o5", cat: "cup", color: "yellow", size: "small", material: "paper", handle: false, lid: false },
    { id: "o6", cat: "cup", color: "white", size: "large", material: "paper", handle: false, lid: false }
  ] },
  { id: "off-cups-04", set: "offline", family: "cups", objects: [
    { id: "o1", cat: "cup", color: "white", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "white", size: "small", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "orange", size: "medium", material: "paper", handle: false, lid: true },
    { id: "o4", cat: "cup", color: "grey", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o5", cat: "cup", color: "orange", size: "small", material: "paper", handle: false, lid: false },
    { id: "o6", cat: "cup", color: "blue", size: "large", material: "paper", handle: false, lid: false }
  ] },
  { id: "off-cups-05", set: "offline", family: "cups", objects: [
    { id: "o1", cat: "cup", color: "pink", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "pink", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "green", size: "small", material: "paper", handle: false, lid: true },
    { id: "o4", cat: "cup", color: "red", size: "small", material: "paper", handle: false, lid: false },
    { id: "o5", cat: "cup", color: "green", size: "medium", material: "paper", handle: false, lid: false },
    { id: "o6", cat: "cup", color: "yellow", size: "large", material: "ceramic", handle: true, lid: false }
  ] },
  { id: "off-cups-06", set: "offline", family: "cups", objects: [
    { id: "o1", cat: "cup", color: "blue", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "blue", size: "small", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "white", size: "medium", material: "paper", handle: false, lid: true },
    { id: "o4", cat: "cup", color: "orange", size: "small", material: "paper", handle: false, lid: false },
    { id: "o5", cat: "cup", color: "black", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o6", cat: "cup", color: "grey", size: "large", material: "paper", handle: false, lid: false }
  ] },
  { id: "off-cups-07", set: "offline", family: "cups", objects: [
    { id: "o1", cat: "cup", color: "yellow", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "yellow", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "pink", size: "small", material: "paper", handle: false, lid: true },
    { id: "o4", cat: "cup", color: "white", size: "small", material: "paper", handle: false, lid: false },
    { id: "o5", cat: "cup", color: "red", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o6", cat: "cup", color: "blue", size: "large", material: "paper", handle: false, lid: false }
  ] },
  { id: "off-cups-08", set: "offline", family: "cups", objects: [
    { id: "o1", cat: "cup", color: "grey", size: "small", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "grey", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "red", size: "medium", material: "paper", handle: false, lid: true },
    { id: "o4", cat: "cup", color: "green", size: "medium", material: "paper", handle: false, lid: false },
    { id: "o5", cat: "cup", color: "orange", size: "small", material: "paper", handle: false, lid: false },
    { id: "o6", cat: "cup", color: "white", size: "small", material: "ceramic", handle: true, lid: false }
  ] },
  { id: "off-cups-09", set: "offline", family: "cups", objects: [
    { id: "o1", cat: "cup", color: "orange", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "orange", size: "small", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "blue", size: "medium", material: "paper", handle: false, lid: true },
    { id: "o4", cat: "cup", color: "yellow", size: "small", material: "paper", handle: false, lid: false },
    { id: "o5", cat: "cup", color: "pink", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o6", cat: "cup", color: "black", size: "large", material: "paper", handle: false, lid: false }
  ] },
  { id: "off-bottles-01", set: "offline", family: "bottles", objects: [
    { id: "o1", cat: "bottle", color: "clear", size: "small", material: "glass", lid: false },
    { id: "o2", cat: "bottle", color: "clear", size: "large", material: "plastic", lid: true },
    { id: "o3", cat: "bottle", color: "green", size: "medium", material: "glass", lid: false },
    { id: "o4", cat: "bottle", color: "orange", size: "small", material: "plastic", lid: false }
  ] },
  { id: "off-bottles-02", set: "offline", family: "bottles", objects: [
    { id: "o1", cat: "bottle", color: "white", size: "medium", material: "plastic", lid: true },
    { id: "o2", cat: "bottle", color: "white", size: "small", material: "plastic", lid: false },
    { id: "o3", cat: "bottle", color: "blue", size: "large", material: "glass", lid: false },
    { id: "o4", cat: "bottle", color: "green", size: "small", material: "glass", lid: true }
  ] },
  { id: "off-bottles-03", set: "offline", family: "bottles", objects: [
    { id: "o1", cat: "bottle", color: "green", size: "small", material: "plastic", lid: false },
    { id: "o2", cat: "bottle", color: "green", size: "large", material: "plastic", lid: true },
    { id: "o3", cat: "bottle", color: "orange", size: "medium", material: "glass", lid: false },
    { id: "o4", cat: "bottle", color: "clear", size: "medium", material: "glass", lid: false }
  ] },
  { id: "off-bottles-04", set: "offline", family: "bottles", objects: [
    { id: "o1", cat: "bottle", color: "yellow", size: "medium", material: "plastic", lid: false },
    { id: "o2", cat: "bottle", color: "yellow", size: "large", material: "plastic", lid: true },
    { id: "o3", cat: "bottle", color: "pink", size: "small", material: "glass", lid: false },
    { id: "o4", cat: "bottle", color: "blue", size: "medium", material: "glass", lid: false }
  ] },
  { id: "off-bottles-05", set: "offline", family: "bottles", objects: [
    { id: "o1", cat: "bottle", color: "clear", size: "medium", material: "plastic", lid: false },
    { id: "o2", cat: "bottle", color: "clear", size: "large", material: "plastic", lid: false },
    { id: "o3", cat: "bottle", color: "grey", size: "small", material: "glass", lid: true },
    { id: "o4", cat: "bottle", color: "red", size: "medium", material: "glass", lid: false }
  ] },
  { id: "off-bottles-06", set: "offline", family: "bottles", objects: [
    { id: "o1", cat: "bottle", color: "blue", size: "small", material: "plastic", lid: false },
    { id: "o2", cat: "bottle", color: "blue", size: "large", material: "plastic", lid: true },
    { id: "o3", cat: "bottle", color: "white", size: "medium", material: "glass", lid: false },
    { id: "o4", cat: "bottle", color: "orange", size: "medium", material: "glass", lid: false }
  ] },
  { id: "off-bottles-07", set: "offline", family: "bottles", objects: [
    { id: "o1", cat: "bottle", color: "red", size: "large", material: "glass", lid: false },
    { id: "o2", cat: "bottle", color: "red", size: "small", material: "glass", lid: true },
    { id: "o3", cat: "bottle", color: "green", size: "medium", material: "plastic", lid: false },
    { id: "o4", cat: "bottle", color: "clear", size: "small", material: "plastic", lid: false }
  ] },
  { id: "off-bottles-08", set: "offline", family: "bottles", objects: [
    { id: "o1", cat: "bottle", color: "pink", size: "medium", material: "plastic", lid: true },
    { id: "o2", cat: "bottle", color: "pink", size: "large", material: "plastic", lid: false },
    { id: "o3", cat: "bottle", color: "clear", size: "small", material: "glass", lid: false },
    { id: "o4", cat: "bottle", color: "yellow", size: "small", material: "glass", lid: false }
  ] },
  { id: "off-bottles-09", set: "offline", family: "bottles", objects: [
    { id: "o1", cat: "bottle", color: "orange", size: "small", material: "plastic", lid: false },
    { id: "o2", cat: "bottle", color: "orange", size: "large", material: "plastic", lid: true },
    { id: "o3", cat: "bottle", color: "blue", size: "medium", material: "glass", lid: false },
    { id: "o4", cat: "bottle", color: "grey", size: "medium", material: "glass", lid: true }
  ] },
  { id: "off-utensils-01", set: "offline", family: "utensils", objects: [
    { id: "o1", cat: "fork", color: "grey", size: "large", material: "metal" },
    { id: "o2", cat: "fork", color: "grey", size: "medium", material: "metal" },
    { id: "o3", cat: "fork", color: "white", size: "small", material: "plastic" },
    { id: "o4", cat: "fork", color: "blue", size: "small", material: "plastic" }
  ] },
  { id: "off-utensils-02", set: "offline", family: "utensils", objects: [
    { id: "o1", cat: "fork", color: "black", size: "large", material: "plastic" },
    { id: "o2", cat: "fork", color: "black", size: "small", material: "plastic" },
    { id: "o3", cat: "fork", color: "grey", size: "medium", material: "metal" },
    { id: "o4", cat: "fork", color: "grey", size: "large", material: "metal" }
  ] },
  { id: "off-utensils-03", set: "offline", family: "utensils", objects: [
    { id: "o1", cat: "fork", color: "yellow", size: "medium", material: "plastic" },
    { id: "o2", cat: "fork", color: "yellow", size: "large", material: "plastic" },
    { id: "o3", cat: "fork", color: "grey", size: "small", material: "metal" },
    { id: "o4", cat: "fork", color: "grey", size: "large", material: "metal" }
  ] },
  { id: "off-utensils-04", set: "offline", family: "utensils", objects: [
    { id: "o1", cat: "spoon", color: "grey", size: "medium", material: "metal" },
    { id: "o2", cat: "spoon", color: "grey", size: "large", material: "metal" },
    { id: "o3", cat: "spoon", color: "pink", size: "small", material: "plastic" },
    { id: "o4", cat: "spoon", color: "white", size: "small", material: "plastic" }
  ] },
  { id: "off-utensils-05", set: "offline", family: "utensils", objects: [
    { id: "o1", cat: "spoon", color: "blue", size: "large", material: "plastic" },
    { id: "o2", cat: "spoon", color: "blue", size: "small", material: "plastic" },
    { id: "o3", cat: "spoon", color: "grey", size: "medium", material: "metal" },
    { id: "o4", cat: "spoon", color: "grey", size: "large", material: "metal" }
  ] },
  { id: "off-utensils-06", set: "offline", family: "utensils", objects: [
    { id: "o1", cat: "spoon", color: "orange", size: "medium", material: "plastic" },
    { id: "o2", cat: "spoon", color: "orange", size: "large", material: "plastic" },
    { id: "o3", cat: "spoon", color: "grey", size: "small", material: "metal" },
    { id: "o4", cat: "spoon", color: "grey", size: "large", material: "metal" }
  ] },
  { id: "off-utensils-07", set: "offline", family: "utensils", objects: [
    { id: "o1", cat: "fork", color: "grey", size: "large", material: "metal" },
    { id: "o2", cat: "fork", color: "grey", size: "medium", material: "metal" },
    { id: "o3", cat: "spoon", color: "white", size: "small", material: "plastic" },
    { id: "o4", cat: "spoon", color: "blue", size: "small", material: "plastic" },
    { id: "o5", cat: "spoon", color: "pink", size: "medium", material: "plastic" },
    { id: "o6", cat: "spoon", color: "grey", size: "large", material: "metal" }
  ] },
  { id: "off-utensils-08", set: "offline", family: "utensils", objects: [
    { id: "o1", cat: "fork", color: "grey", size: "medium", material: "metal" },
    { id: "o2", cat: "fork", color: "grey", size: "large", material: "metal" },
    { id: "o3", cat: "fork", color: "white", size: "small", material: "plastic" },
    { id: "o4", cat: "spoon", color: "yellow", size: "medium", material: "plastic" },
    { id: "o5", cat: "spoon", color: "yellow", size: "small", material: "plastic" },
    { id: "o6", cat: "spoon", color: "grey", size: "large", material: "metal" }
  ] },
  { id: "off-utensils-09", set: "offline", family: "utensils", objects: [
    { id: "o1", cat: "fork", color: "white", size: "small", material: "plastic" },
    { id: "o2", cat: "fork", color: "white", size: "large", material: "plastic" },
    { id: "o3", cat: "fork", color: "grey", size: "medium", material: "metal" },
    { id: "o4", cat: "fork", color: "grey", size: "small", material: "metal" },
    { id: "o5", cat: "spoon", color: "pink", size: "medium", material: "plastic" },
    { id: "o6", cat: "spoon", color: "grey", size: "small", material: "metal" }
  ] },
  { id: "off-mixed-01", set: "offline", family: "mixed", objects: [
    { id: "o1", cat: "cup", color: "white", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "white", size: "small", material: "paper", handle: false, lid: true },
    { id: "o3", cat: "cup", color: "blue", size: "large", material: "paper", handle: false, lid: false },
    { id: "o4", cat: "bottle", color: "clear", size: "small", material: "plastic", lid: false },
    { id: "o5", cat: "bottle", color: "green", size: "large", material: "glass", lid: false },
    { id: "o6", cat: "fork", color: "grey", size: "medium", material: "metal" },
    { id: "o7", cat: "fork", color: "grey", size: "large", material: "metal" },
    { id: "o8", cat: "spoon", color: "pink", size: "small", material: "plastic" }
  ] },
  { id: "off-mixed-02", set: "offline", family: "mixed", objects: [
    { id: "o1", cat: "cup", color: "red", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "red", size: "small", material: "paper", handle: false, lid: true },
    { id: "o3", cat: "bottle", color: "yellow", size: "large", material: "plastic", lid: false },
    { id: "o4", cat: "bottle", color: "clear", size: "small", material: "glass", lid: false },
    { id: "o5", cat: "fork", color: "grey", size: "large", material: "metal" },
    { id: "o6", cat: "fork", color: "white", size: "medium", material: "plastic" },
    { id: "o7", cat: "fork", color: "grey", size: "small", material: "metal" },
    { id: "o8", cat: "spoon", color: "blue", size: "medium", material: "plastic" }
  ] },
  { id: "off-mixed-03", set: "offline", family: "mixed", objects: [
    { id: "o1", cat: "cup", color: "green", size: "small", material: "paper", handle: false, lid: false },
    { id: "o2", cat: "cup", color: "green", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "pink", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o4", cat: "bottle", color: "blue", size: "medium", material: "plastic", lid: true },
    { id: "o5", cat: "bottle", color: "clear", size: "small", material: "glass", lid: false },
    { id: "o6", cat: "fork", color: "white", size: "medium", material: "plastic" },
    { id: "o7", cat: "spoon", color: "grey", size: "large", material: "metal" },
    { id: "o8", cat: "spoon", color: "grey", size: "small", material: "metal" }
  ] },
  { id: "off-mixed-04", set: "offline", family: "mixed", objects: [
    { id: "o1", cat: "cup", color: "yellow", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "yellow", size: "small", material: "paper", handle: false, lid: true },
    { id: "o3", cat: "bottle", color: "white", size: "medium", material: "plastic", lid: false },
    { id: "o4", cat: "bottle", color: "clear", size: "large", material: "glass", lid: false },
    { id: "o5", cat: "fork", color: "blue", size: "small", material: "plastic" },
    { id: "o6", cat: "spoon", color: "grey", size: "large", material: "metal" },
    { id: "o7", cat: "spoon", color: "grey", size: "medium", material: "metal" },
    { id: "o8", cat: "spoon", color: "white", size: "small", material: "plastic" }
  ] },
  { id: "off-mixed-05", set: "offline", family: "mixed", objects: [
    { id: "o1", cat: "cup", color: "blue", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "blue", size: "small", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "orange", size: "large", material: "paper", handle: false, lid: false },
    { id: "o4", cat: "bottle", color: "green", size: "small", material: "plastic", lid: true },
    { id: "o5", cat: "bottle", color: "clear", size: "large", material: "glass", lid: false },
    { id: "o6", cat: "fork", color: "pink", size: "medium", material: "plastic" },
    { id: "o7", cat: "fork", color: "white", size: "small", material: "plastic" },
    { id: "o8", cat: "spoon", color: "grey", size: "large", material: "metal" }
  ] },
  { id: "off-mixed-06", set: "offline", family: "mixed", objects: [
    { id: "o1", cat: "cup", color: "grey", size: "medium", material: "paper", handle: false, lid: false },
    { id: "o2", cat: "cup", color: "grey", size: "small", material: "paper", handle: false, lid: true },
    { id: "o3", cat: "bottle", color: "red", size: "large", material: "glass", lid: false },
    { id: "o4", cat: "bottle", color: "blue", size: "small", material: "plastic", lid: true },
    { id: "o5", cat: "fork", color: "yellow", size: "medium", material: "plastic" },
    { id: "o6", cat: "fork", color: "yellow", size: "large", material: "plastic" },
    { id: "o7", cat: "fork", color: "grey", size: "small", material: "metal" },
    { id: "o8", cat: "spoon", color: "pink", size: "large", material: "plastic" }
  ] },
  { id: "off-mixed-07", set: "offline", family: "mixed", objects: [
    { id: "o1", cat: "cup", color: "pink", size: "small", material: "paper", handle: false, lid: true },
    { id: "o2", cat: "cup", color: "pink", size: "large", material: "paper", handle: false, lid: false },
    { id: "o3", cat: "cup", color: "white", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o4", cat: "bottle", color: "orange", size: "medium", material: "glass", lid: false },
    { id: "o5", cat: "bottle", color: "clear", size: "small", material: "plastic", lid: false },
    { id: "o6", cat: "fork", color: "grey", size: "large", material: "metal" },
    { id: "o7", cat: "spoon", color: "blue", size: "medium", material: "plastic" },
    { id: "o8", cat: "spoon", color: "blue", size: "small", material: "plastic" }
  ] },
  { id: "off-mixed-08", set: "offline", family: "mixed", objects: [
    { id: "o1", cat: "cup", color: "black", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "black", size: "small", material: "paper", handle: false, lid: true },
    { id: "o3", cat: "bottle", color: "green", size: "large", material: "plastic", lid: false },
    { id: "o4", cat: "bottle", color: "white", size: "small", material: "glass", lid: false },
    { id: "o5", cat: "fork", color: "orange", size: "medium", material: "plastic" },
    { id: "o6", cat: "spoon", color: "yellow", size: "large", material: "metal" },
    { id: "o7", cat: "spoon", color: "yellow", size: "small", material: "plastic" },
    { id: "o8", cat: "spoon", color: "grey", size: "medium", material: "metal" }
  ] },
  { id: "off-mixed-09", set: "offline", family: "mixed", objects: [
    { id: "o1", cat: "cup", color: "red", size: "small", material: "paper", handle: false, lid: false },
    { id: "o2", cat: "cup", color: "red", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "blue", size: "medium", material: "paper", handle: false, lid: true },
    { id: "o4", cat: "bottle", color: "clear", size: "medium", material: "glass", lid: false },
    { id: "o5", cat: "bottle", color: "yellow", size: "small", material: "plastic", lid: true },
    { id: "o6", cat: "fork", color: "grey", size: "large", material: "metal" },
    { id: "o7", cat: "fork", color: "grey", size: "small", material: "metal" },
    { id: "o8", cat: "spoon", color: "white", size: "medium", material: "plastic" }
  ] },
  { id: "on-cups-01", set: "online", family: "cups", objects: [
    { id: "o1", cat: "cup", color: "white", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "white", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "blue", size: "small", material: "paper", handle: false, lid: true },
    { id: "o4", cat: "cup", color: "green", size: "medium", material: "paper", handle: false, lid: false },
    { id: "o5", cat: "cup", color: "orange", size: "small", material: "paper", handle: false, lid: false },
    { id: "o6", cat: "cup", color: "red", size: "large", material: "ceramic", handle: true, lid: false }
  ] },
  { id: "on-cups-02", set: "online", family: "cups", objects: [
    { id: "o1", cat: "cup", color: "pink", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "pink", size: "small", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "yellow", size: "large", material: "paper", handle: false, lid: true },
    { id: "o4", cat: "cup", color: "green", size: "medium", material: "paper", handle: false, lid: false },
    { id: "o5", cat: "cup", color: "blue", size: "small", material: "paper", handle: false, lid: false },
    { id: "o6", cat: "cup", color: "orange", size: "large", material: "paper", handle: false, lid: false }
  ] },
  { id: "on-cups-03", set: "online", family: "cups", objects: [
    { id: "o1", cat: "cup", color: "orange", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "orange", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "white", size: "small", material: "paper", handle: false, lid: true },
    { id: "o4", cat: "cup", color: "black", size: "medium", material: "paper", handle: false, lid: false },
    { id: "o5", cat: "cup", color: "grey", size: "small", material: "paper", handle: false, lid: false },
    { id: "o6", cat: "cup", color: "blue", size: "large", material: "ceramic", handle: true, lid: false }
  ] },
  { id: "on-cups-04", set: "online", family: "cups", objects: [
    { id: "o1", cat: "cup", color: "green", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "green", size: "small", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "red", size: "medium", material: "paper", handle: false, lid: true },
    { id: "o4", cat: "cup", color: "white", size: "medium", material: "paper", handle: false, lid: false },
    { id: "o5", cat: "cup", color: "blue", size: "small", material: "paper", handle: false, lid: false },
    { id: "o6", cat: "cup", color: "yellow", size: "small", material: "ceramic", handle: true, lid: false }
  ] },
  { id: "on-cups-05", set: "online", family: "cups", objects: [
    { id: "o1", cat: "cup", color: "yellow", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "yellow", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "blue", size: "small", material: "paper", handle: false, lid: true },
    { id: "o4", cat: "cup", color: "pink", size: "medium", material: "paper", handle: false, lid: false },
    { id: "o5", cat: "cup", color: "white", size: "large", material: "paper", handle: false, lid: false },
    { id: "o6", cat: "cup", color: "green", size: "small", material: "paper", handle: false, lid: false }
  ] },
  { id: "on-bottles-01", set: "online", family: "bottles", objects: [
    { id: "o1", cat: "bottle", color: "clear", size: "small", material: "glass", lid: false },
    { id: "o2", cat: "bottle", color: "clear", size: "large", material: "plastic", lid: true },
    { id: "o3", cat: "bottle", color: "green", size: "medium", material: "plastic", lid: false }
  ] },
  { id: "on-bottles-02", set: "online", family: "bottles", objects: [
    { id: "o1", cat: "bottle", color: "white", size: "medium", material: "plastic", lid: true },
    { id: "o2", cat: "bottle", color: "white", size: "small", material: "plastic", lid: false },
    { id: "o3", cat: "bottle", color: "blue", size: "large", material: "glass", lid: false }
  ] },
  { id: "on-bottles-03", set: "online", family: "bottles", objects: [
    { id: "o1", cat: "bottle", color: "green", size: "small", material: "plastic", lid: false },
    { id: "o2", cat: "bottle", color: "green", size: "large", material: "plastic", lid: true },
    { id: "o3", cat: "bottle", color: "orange", size: "medium", material: "glass", lid: false }
  ] },
  { id: "on-bottles-04", set: "online", family: "bottles", objects: [
    { id: "o1", cat: "bottle", color: "yellow", size: "medium", material: "plastic", lid: false },
    { id: "o2", cat: "bottle", color: "yellow", size: "large", material: "plastic", lid: true },
    { id: "o3", cat: "bottle", color: "pink", size: "small", material: "glass", lid: false }
  ] },
  { id: "on-bottles-05", set: "online", family: "bottles", objects: [
    { id: "o1", cat: "bottle", color: "clear", size: "small", material: "glass", lid: true },
    { id: "o2", cat: "bottle", color: "clear", size: "large", material: "plastic", lid: false },
    { id: "o3", cat: "bottle", color: "blue", size: "medium", material: "glass", lid: false }
  ] },
  { id: "on-utensils-01", set: "online", family: "utensils", objects: [
    { id: "o1", cat: "spoon", color: "grey", size: "medium", material: "metal" },
    { id: "o2", cat: "spoon", color: "grey", size: "large", material: "metal" },
    { id: "o3", cat: "spoon", color: "pink", size: "small", material: "plastic" },
    { id: "o4", cat: "spoon", color: "green", size: "small", material: "plastic" }
  ] },
  { id: "on-utensils-02", set: "online", family: "utensils", objects: [
    { id: "o1", cat: "spoon", color: "black", size: "large", material: "plastic" },
    { id: "o2", cat: "spoon", color: "black", size: "small", material: "plastic" },
    { id: "o3", cat: "spoon", color: "grey", size: "medium", material: "metal" },
    { id: "o4", cat: "spoon", color: "grey", size: "large", material: "metal" }
  ] },
  { id: "on-utensils-03", set: "online", family: "utensils", objects: [
    { id: "o1", cat: "fork", color: "grey", size: "large", material: "metal" },
    { id: "o2", cat: "fork", color: "grey", size: "medium", material: "metal" },
    { id: "o3", cat: "fork", color: "white", size: "small", material: "plastic" },
    { id: "o4", cat: "fork", color: "red", size: "small", material: "plastic" }
  ] },
  { id: "on-utensils-04", set: "online", family: "utensils", objects: [
    { id: "o1", cat: "fork", color: "pink", size: "large", material: "plastic" },
    { id: "o2", cat: "fork", color: "pink", size: "small", material: "plastic" },
    { id: "o3", cat: "fork", color: "grey", size: "medium", material: "metal" },
    { id: "o4", cat: "fork", color: "grey", size: "large", material: "metal" }
  ] },
  { id: "on-utensils-05", set: "online", family: "utensils", objects: [
    { id: "o1", cat: "fork", color: "white", size: "small", material: "plastic" },
    { id: "o2", cat: "fork", color: "white", size: "large", material: "plastic" },
    { id: "o3", cat: "fork", color: "grey", size: "medium", material: "metal" },
    { id: "o4", cat: "fork", color: "grey", size: "small", material: "metal" },
    { id: "o5", cat: "spoon", color: "pink", size: "medium", material: "plastic" },
    { id: "o6", cat: "spoon", color: "grey", size: "small", material: "metal" }
  ] },
  { id: "on-mixed-01", set: "online", family: "mixed", objects: [
    { id: "o1", cat: "cup", color: "white", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "white", size: "small", material: "paper", handle: false, lid: true },
    { id: "o3", cat: "cup", color: "green", size: "large", material: "paper", handle: false, lid: false },
    { id: "o4", cat: "bottle", color: "clear", size: "small", material: "plastic", lid: false },
    { id: "o5", cat: "bottle", color: "blue", size: "large", material: "glass", lid: false },
    { id: "o6", cat: "fork", color: "grey", size: "medium", material: "metal" },
    { id: "o7", cat: "fork", color: "grey", size: "large", material: "metal" },
    { id: "o8", cat: "spoon", color: "pink", size: "small", material: "plastic" }
  ] },
  { id: "on-mixed-02", set: "online", family: "mixed", objects: [
    { id: "o1", cat: "cup", color: "red", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "red", size: "small", material: "paper", handle: false, lid: true },
    { id: "o3", cat: "bottle", color: "yellow", size: "large", material: "plastic", lid: false },
    { id: "o4", cat: "bottle", color: "white", size: "small", material: "glass", lid: false },
    { id: "o5", cat: "fork", color: "grey", size: "large", material: "metal" },
    { id: "o6", cat: "fork", color: "white", size: "medium", material: "plastic" },
    { id: "o7", cat: "fork", color: "grey", size: "small", material: "metal" },
    { id: "o8", cat: "spoon", color: "pink", size: "medium", material: "plastic" }
  ] },
  { id: "on-mixed-03", set: "online", family: "mixed", objects: [
    { id: "o1", cat: "cup", color: "yellow", size: "small", material: "paper", handle: false, lid: false },
    { id: "o2", cat: "cup", color: "yellow", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "pink", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o4", cat: "bottle", color: "blue", size: "medium", material: "plastic", lid: true },
    { id: "o5", cat: "bottle", color: "clear", size: "small", material: "glass", lid: false },
    { id: "o6", cat: "fork", color: "white", size: "medium", material: "plastic" },
    { id: "o7", cat: "spoon", color: "grey", size: "large", material: "metal" },
    { id: "o8", cat: "spoon", color: "grey", size: "small", material: "metal" }
  ] },
  { id: "on-mixed-04", set: "online", family: "mixed", objects: [
    { id: "o1", cat: "cup", color: "white", size: "large", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "yellow", size: "small", material: "paper", handle: false, lid: true },
    { id: "o3", cat: "bottle", color: "green", size: "medium", material: "plastic", lid: false },
    { id: "o4", cat: "bottle", color: "clear", size: "large", material: "glass", lid: false },
    { id: "o5", cat: "fork", color: "blue", size: "small", material: "plastic" },
    { id: "o6", cat: "spoon", color: "grey", size: "large", material: "metal" },
    { id: "o7", cat: "spoon", color: "grey", size: "medium", material: "metal" },
    { id: "o8", cat: "spoon", color: "white", size: "small", material: "plastic" }
  ] },
  { id: "on-mixed-05", set: "online", family: "mixed", objects: [
    { id: "o1", cat: "cup", color: "blue", size: "medium", material: "ceramic", handle: true, lid: false },
    { id: "o2", cat: "cup", color: "blue", size: "small", material: "ceramic", handle: true, lid: false },
    { id: "o3", cat: "cup", color: "red", size: "large", material: "paper", handle: false, lid: false },
    { id: "o4", cat: "bottle", color: "green", size: "small", material: "plastic", lid: true },
    { id: "o5", cat: "bottle", color: "clear", size: "large", material: "glass", lid: false },
    { id: "o6", cat: "fork", color: "pink", size: "medium", material: "plastic" },
    { id: "o7", cat: "fork", color: "white", size: "small", material: "plastic" },
    { id: "o8", cat: "spoon", color: "grey", size: "large", material: "metal" }
  ] },
];
const INSTRUCTIONS = {
  "off-cups-01": [
    { text: "pick up the small blue cup with a lid", type: "clear", noun: "cup", mods: { color: "blue", size: "small", lid: true }, matches: ["o3"] },
    { text: "grab the large cup", type: "clear", noun: "cup", mods: { size: "large" }, matches: ["o4"] },
    { text: "pick up the orange cup", type: "partial", noun: "cup", mods: { color: "orange" }, matches: ["o1", "o4"] },
    { text: "get me the paper cup", type: "partial", noun: "cup", mods: { material: "paper" }, matches: ["o3", "o5", "o6"] },
    { text: "pick up my cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
    { text: "grab the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
  ],
  "off-cups-02": [
    { text: "hand me the pink cup", type: "clear", noun: "cup", mods: { color: "pink" }, matches: ["o6"] },
    { text: "pick up the large red cup", type: "clear", noun: "cup", mods: { color: "red", size: "large" }, matches: ["o2"] },
    { text: "grab the red cup", type: "partial", noun: "cup", mods: { color: "red" }, matches: ["o1", "o2"] },
    { text: "pass me the white cup", type: "partial", noun: "cup", mods: { color: "white" }, matches: ["o3", "o5"] },
    { text: "hand me the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
    { text: "bring me a cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
  ],
  "off-cups-03": [
    { text: "bring me the black cup", type: "clear", noun: "cup", mods: { color: "black" }, matches: ["o4"] },
    { text: "pick up the large white cup", type: "clear", noun: "cup", mods: { color: "white", size: "large" }, matches: ["o6"] },
    { text: "get me the green cup", type: "partial", noun: "cup", mods: { color: "green" }, matches: ["o1", "o2"] },
    { text: "take the yellow cup", type: "partial", noun: "cup", mods: { color: "yellow" }, matches: ["o3", "o5"] },
    { text: "get me the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
    { text: "take my cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
  ],
  "off-cups-04": [
    { text: "get me the grey cup", type: "clear", noun: "cup", mods: { color: "grey" }, matches: ["o4"] },
    { text: "pick up the blue cup", type: "clear", noun: "cup", mods: { color: "blue" }, matches: ["o6"] },
    { text: "hand me the orange cup", type: "partial", noun: "cup", mods: { color: "orange" }, matches: ["o3", "o5"] },
    { text: "take the white cup", type: "partial", noun: "cup", mods: { color: "white" }, matches: ["o1", "o2"] },
    { text: "pass me the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
    { text: "fetch the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
  ],
  "off-cups-05": [
    { text: "bring me the red cup", type: "clear", noun: "cup", mods: { color: "red" }, matches: ["o4"] },
    { text: "pick up the large pink cup", type: "clear", noun: "cup", mods: { color: "pink", size: "large" }, matches: ["o2"] },
    { text: "grab the pink cup", type: "partial", noun: "cup", mods: { color: "pink" }, matches: ["o1", "o2"] },
    { text: "hand me the green cup", type: "partial", noun: "cup", mods: { color: "green" }, matches: ["o3", "o5"] },
    { text: "pick up my cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
    { text: "hand me the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
  ],
  "off-cups-06": [
    { text: "hand me the black cup", type: "clear", noun: "cup", mods: { color: "black" }, matches: ["o5"] },
    { text: "pick up the small blue cup", type: "clear", noun: "cup", mods: { color: "blue", size: "small" }, matches: ["o2"] },
    { text: "get me the blue cup", type: "partial", noun: "cup", mods: { color: "blue" }, matches: ["o1", "o2"] },
    { text: "take the medium cup", type: "partial", noun: "cup", mods: { size: "medium" }, matches: ["o3", "o5"] },
    { text: "grab the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
    { text: "get me the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
  ],
  "off-cups-07": [
    { text: "pick up the small pink cup", type: "clear", noun: "cup", mods: { color: "pink", size: "small" }, matches: ["o3"] },
    { text: "grab the large blue cup", type: "clear", noun: "cup", mods: { color: "blue", size: "large" }, matches: ["o6"] },
    { text: "bring me the yellow cup", type: "partial", noun: "cup", mods: { color: "yellow" }, matches: ["o1", "o2"] },
    { text: "pass me the small cup", type: "partial", noun: "cup", mods: { size: "small" }, matches: ["o3", "o4"] },
    { text: "bring me a cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
    { text: "take my cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
  ],
  "off-cups-08": [
    { text: "bring me the large grey cup", type: "clear", noun: "cup", mods: { color: "grey", size: "large" }, matches: ["o2"] },
    { text: "pick up the green cup", type: "clear", noun: "cup", mods: { color: "green" }, matches: ["o4"] },
    { text: "grab the grey cup", type: "partial", noun: "cup", mods: { color: "grey" }, matches: ["o1", "o2"] },
    { text: "hand me the small cup", type: "partial", noun: "cup", mods: { size: "small" }, matches: ["o1", "o5", "o6"] },
    { text: "pick up my cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
    { text: "pass me the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
  ],
  "off-cups-09": [
    { text: "get me the small orange cup", type: "clear", noun: "cup", mods: { color: "orange", size: "small" }, matches: ["o2"] },
    { text: "pick up the cup with a lid", type: "clear", noun: "cup", mods: { lid: true }, matches: ["o3"] },
    { text: "fetch the orange cup", type: "partial", noun: "cup", mods: { color: "orange" }, matches: ["o1", "o2"] },
    { text: "bring me the medium cup", type: "partial", noun: "cup", mods: { size: "medium" }, matches: ["o3", "o5"] },
    { text: "grab the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
    { text: "hand me the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
  ],
  "off-bottles-01": [
    { text: "pick up the green bottle", type: "clear", noun: "bottle", mods: { color: "green" }, matches: ["o3"] },
    { text: "bring me the small clear bottle", type: "clear", noun: "bottle", mods: { color: "clear", size: "small" }, matches: ["o1"] },
    { text: "hand me the clear bottle", type: "partial", noun: "bottle", mods: { color: "clear" }, matches: ["o1", "o2"] },
    { text: "get me the small bottle", type: "partial", noun: "bottle", mods: { size: "small" }, matches: ["o1", "o4"] },
    { text: "pick up my bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "grab the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-bottles-02": [
    { text: "fetch the blue bottle", type: "clear", noun: "bottle", mods: { color: "blue" }, matches: ["o3"] },
    { text: "pick up the white bottle with a lid", type: "clear", noun: "bottle", mods: { color: "white", lid: true }, matches: ["o1"] },
    { text: "take the white bottle", type: "partial", noun: "bottle", mods: { color: "white" }, matches: ["o1", "o2"] },
    { text: "hand me the glass bottle", type: "partial", noun: "bottle", mods: { material: "glass" }, matches: ["o3", "o4"] },
    { text: "hand me the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "bring me a bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-bottles-03": [
    { text: "get me the clear bottle", type: "clear", noun: "bottle", mods: { color: "clear" }, matches: ["o4"] },
    { text: "pass me the small green bottle", type: "clear", noun: "bottle", mods: { color: "green", size: "small" }, matches: ["o1"] },
    { text: "bring me the green bottle", type: "partial", noun: "bottle", mods: { color: "green" }, matches: ["o1", "o2"] },
    { text: "get me the glass bottle", type: "partial", noun: "bottle", mods: { material: "glass" }, matches: ["o3", "o4"] },
    { text: "get me the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "take my bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-bottles-04": [
    { text: "pick up the small pink bottle", type: "clear", noun: "bottle", mods: { color: "pink", size: "small" }, matches: ["o3"] },
    { text: "hand me the blue bottle", type: "clear", noun: "bottle", mods: { color: "blue" }, matches: ["o4"] },
    { text: "bring me the yellow bottle", type: "partial", noun: "bottle", mods: { color: "yellow" }, matches: ["o1", "o2"] },
    { text: "get me the plastic bottle", type: "partial", noun: "bottle", mods: { material: "plastic" }, matches: ["o1", "o2"] },
    { text: "pass me the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "fetch the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-bottles-05": [
    { text: "pick up the red bottle", type: "clear", noun: "bottle", mods: { color: "red" }, matches: ["o4"] },
    { text: "bring me the small grey bottle", type: "clear", noun: "bottle", mods: { color: "grey", size: "small" }, matches: ["o3"] },
    { text: "grab the clear bottle", type: "partial", noun: "bottle", mods: { color: "clear" }, matches: ["o1", "o2"] },
    { text: "take the plastic bottle", type: "partial", noun: "bottle", mods: { material: "plastic" }, matches: ["o1", "o2"] },
    { text: "pick up my bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "grab the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-bottles-06": [
    { text: "grab the orange bottle", type: "clear", noun: "bottle", mods: { color: "orange" }, matches: ["o4"] },
    { text: "pick up the blue bottle with a lid", type: "clear", noun: "bottle", mods: { color: "blue", lid: true }, matches: ["o2"] },
    { text: "get me the blue bottle", type: "partial", noun: "bottle", mods: { color: "blue" }, matches: ["o1", "o2"] },
    { text: "pass me the medium bottle", type: "partial", noun: "bottle", mods: { size: "medium" }, matches: ["o3", "o4"] },
    { text: "hand me the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "bring me a bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-bottles-07": [
    { text: "get me the large red bottle", type: "clear", noun: "bottle", mods: { color: "red", size: "large" }, matches: ["o1"] },
    { text: "take the green bottle", type: "clear", noun: "bottle", mods: { color: "green" }, matches: ["o3"] },
    { text: "hand me the red bottle", type: "partial", noun: "bottle", mods: { color: "red" }, matches: ["o1", "o2"] },
    { text: "bring me the small bottle", type: "partial", noun: "bottle", mods: { size: "small" }, matches: ["o2", "o4"] },
    { text: "get me the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "take my bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-bottles-08": [
    { text: "hand me the small clear bottle", type: "clear", noun: "bottle", mods: { color: "clear", size: "small" }, matches: ["o3"] },
    { text: "pick up the large pink bottle", type: "clear", noun: "bottle", mods: { color: "pink", size: "large" }, matches: ["o2"] },
    { text: "get me the pink bottle", type: "partial", noun: "bottle", mods: { color: "pink" }, matches: ["o1", "o2"] },
    { text: "pass me the glass bottle", type: "partial", noun: "bottle", mods: { material: "glass" }, matches: ["o3", "o4"] },
    { text: "pass me the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "fetch the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-bottles-09": [
    { text: "bring me the grey bottle", type: "clear", noun: "bottle", mods: { color: "grey" }, matches: ["o4"] },
    { text: "pick up the small orange bottle", type: "clear", noun: "bottle", mods: { color: "orange", size: "small" }, matches: ["o1"] },
    { text: "fetch the orange bottle", type: "partial", noun: "bottle", mods: { color: "orange" }, matches: ["o1", "o2"] },
    { text: "hand me the medium bottle", type: "partial", noun: "bottle", mods: { size: "medium" }, matches: ["o3", "o4"] },
    { text: "pick up my bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "grab the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-utensils-01": [
    { text: "pick up the white fork", type: "clear", noun: "fork", mods: { color: "white" }, matches: ["o3"] },
    { text: "grab the blue fork", type: "clear", noun: "fork", mods: { color: "blue" }, matches: ["o4"] },
    { text: "hand me the grey fork", type: "partial", noun: "fork", mods: { color: "grey" }, matches: ["o1", "o2"] },
    { text: "get me the metal fork", type: "partial", noun: "fork", mods: { material: "metal" }, matches: ["o1", "o2"] },
    { text: "pick up my fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "grab the fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-utensils-02": [
    { text: "bring me the large black fork", type: "clear", noun: "fork", mods: { color: "black", size: "large" }, matches: ["o1"] },
    { text: "pick up the medium grey fork", type: "clear", noun: "fork", mods: { color: "grey", size: "medium" }, matches: ["o3"] },
    { text: "get me the black fork", type: "partial", noun: "fork", mods: { color: "black" }, matches: ["o1", "o2"] },
    { text: "pass me the metal fork", type: "partial", noun: "fork", mods: { material: "metal" }, matches: ["o3", "o4"] },
    { text: "hand me the fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "bring me a fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-utensils-03": [
    { text: "get me the small grey fork", type: "clear", noun: "fork", mods: { color: "grey", size: "small" }, matches: ["o3"] },
    { text: "pick up the large yellow fork", type: "clear", noun: "fork", mods: { color: "yellow", size: "large" }, matches: ["o2"] },
    { text: "grab the yellow fork", type: "partial", noun: "fork", mods: { color: "yellow" }, matches: ["o1", "o2"] },
    { text: "take the grey fork", type: "partial", noun: "fork", mods: { color: "grey" }, matches: ["o3", "o4"] },
    { text: "get me the fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "take my fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-utensils-04": [
    { text: "pick up the pink spoon", type: "clear", noun: "spoon", mods: { color: "pink" }, matches: ["o3"] },
    { text: "grab the white spoon", type: "clear", noun: "spoon", mods: { color: "white" }, matches: ["o4"] },
    { text: "bring me the grey spoon", type: "partial", noun: "spoon", mods: { color: "grey" }, matches: ["o1", "o2"] },
    { text: "get me the metal spoon", type: "partial", noun: "spoon", mods: { material: "metal" }, matches: ["o1", "o2"] },
    { text: "pick up my spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "grab the spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-utensils-05": [
    { text: "hand me the large blue spoon", type: "clear", noun: "spoon", mods: { color: "blue", size: "large" }, matches: ["o1"] },
    { text: "pick up the medium grey spoon", type: "clear", noun: "spoon", mods: { color: "grey", size: "medium" }, matches: ["o3"] },
    { text: "get me the blue spoon", type: "partial", noun: "spoon", mods: { color: "blue" }, matches: ["o1", "o2"] },
    { text: "pass me the metal spoon", type: "partial", noun: "spoon", mods: { material: "metal" }, matches: ["o3", "o4"] },
    { text: "hand me the spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "bring me a spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-utensils-06": [
    { text: "get me the small grey spoon", type: "clear", noun: "spoon", mods: { color: "grey", size: "small" }, matches: ["o3"] },
    { text: "pick up the large orange spoon", type: "clear", noun: "spoon", mods: { color: "orange", size: "large" }, matches: ["o2"] },
    { text: "grab the orange spoon", type: "partial", noun: "spoon", mods: { color: "orange" }, matches: ["o1", "o2"] },
    { text: "take the grey spoon", type: "partial", noun: "spoon", mods: { color: "grey" }, matches: ["o3", "o4"] },
    { text: "get me the spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "take my spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-utensils-07": [
    { text: "bring me the pink spoon", type: "clear", noun: "spoon", mods: { color: "pink" }, matches: ["o5"] },
    { text: "grab the large grey fork", type: "clear", noun: "fork", mods: { color: "grey", size: "large" }, matches: ["o1"] },
    { text: "hand me the plastic spoon", type: "partial", noun: "spoon", mods: { material: "plastic" }, matches: ["o3", "o4", "o5"] },
    { text: "pass me the small spoon", type: "partial", noun: "spoon", mods: { size: "small" }, matches: ["o3", "o4"] },
    { text: "pick up my fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o1", "o2"] },
    { text: "pass me the spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o3", "o4", "o5", "o6"] },
  ],
  "off-utensils-08": [
    { text: "get me the white fork", type: "clear", noun: "fork", mods: { color: "white" }, matches: ["o3"] },
    { text: "hand me the large grey spoon", type: "clear", noun: "spoon", mods: { color: "grey", size: "large" }, matches: ["o6"] },
    { text: "grab the yellow spoon", type: "partial", noun: "spoon", mods: { color: "yellow" }, matches: ["o4", "o5"] },
    { text: "bring me the grey fork", type: "partial", noun: "fork", mods: { color: "grey" }, matches: ["o1", "o2"] },
    { text: "pass me the fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o1", "o2", "o3"] },
    { text: "pick up my spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o4", "o5", "o6"] },
  ],
  "off-utensils-09": [
    { text: "pick up the large white fork", type: "clear", noun: "fork", mods: { color: "white", size: "large" }, matches: ["o2"] },
    { text: "grab the pink spoon", type: "clear", noun: "spoon", mods: { color: "pink" }, matches: ["o5"] },
    { text: "hand me the white fork", type: "partial", noun: "fork", mods: { color: "white" }, matches: ["o1", "o2"] },
    { text: "get me the grey fork", type: "partial", noun: "fork", mods: { color: "grey" }, matches: ["o3", "o4"] },
    { text: "pick up my fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "grab the fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "off-mixed-01": [
    { text: "bring me the blue cup", type: "clear", noun: "cup", mods: { color: "blue" }, matches: ["o3"] },
    { text: "get me the small clear bottle", type: "clear", noun: "bottle", mods: { color: "clear", size: "small" }, matches: ["o4"] },
    { text: "hand me the white cup", type: "partial", noun: "cup", mods: { color: "white" }, matches: ["o1", "o2"] },
    { text: "bring me the paper cup", type: "partial", noun: "cup", mods: { material: "paper" }, matches: ["o2", "o3"] },
    { text: "lift my cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3"] },
    { text: "bring me the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o4", "o5"] },
  ],
  "off-mixed-02": [
    { text: "get me the yellow bottle", type: "clear", noun: "bottle", mods: { color: "yellow" }, matches: ["o3"] },
    { text: "pick up the small red cup", type: "clear", noun: "cup", mods: { color: "red", size: "small" }, matches: ["o2"] },
    { text: "grab the grey fork", type: "partial", noun: "fork", mods: { color: "grey" }, matches: ["o5", "o7"] },
    { text: "hand me the metal fork", type: "partial", noun: "fork", mods: { material: "metal" }, matches: ["o5", "o7"] },
    { text: "get my cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2"] },
    { text: "take the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o3", "o4"] },
  ],
  "off-mixed-03": [
    { text: "grab the blue bottle", type: "clear", noun: "bottle", mods: { color: "blue" }, matches: ["o4"] },
    { text: "pick up the medium pink cup", type: "clear", noun: "cup", mods: { color: "pink", size: "medium" }, matches: ["o3"] },
    { text: "take the green cup", type: "partial", noun: "cup", mods: { color: "green" }, matches: ["o1", "o2"] },
    { text: "bring me the ceramic cup", type: "partial", noun: "cup", mods: { material: "ceramic" }, matches: ["o2", "o3"] },
    { text: "take the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3"] },
    { text: "pick up my spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o7", "o8"] },
  ],
  "off-mixed-04": [
    { text: "hand me the small yellow cup", type: "clear", noun: "cup", mods: { color: "yellow", size: "small" }, matches: ["o2"] },
    { text: "pick up the white bottle", type: "clear", noun: "bottle", mods: { color: "white" }, matches: ["o3"] },
    { text: "get me the grey spoon", type: "partial", noun: "spoon", mods: { color: "grey" }, matches: ["o6", "o7"] },
    { text: "bring me the metal spoon", type: "partial", noun: "spoon", mods: { material: "metal" }, matches: ["o6", "o7"] },
    { text: "bring me the spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o6", "o7", "o8"] },
    { text: "pick up the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2"] },
  ],
  "off-mixed-05": [
    { text: "get me the small blue cup", type: "clear", noun: "cup", mods: { color: "blue", size: "small" }, matches: ["o2"] },
    { text: "grab the orange cup", type: "clear", noun: "cup", mods: { color: "orange" }, matches: ["o3"] },
    { text: "hand me the blue cup", type: "partial", noun: "cup", mods: { color: "blue" }, matches: ["o1", "o2"] },
    { text: "pass me the ceramic cup", type: "partial", noun: "cup", mods: { material: "ceramic" }, matches: ["o1", "o2"] },
    { text: "bring me the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3"] },
    { text: "lift my fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o6", "o7"] },
  ],
  "off-mixed-06": [
    { text: "grab the large red bottle", type: "clear", noun: "bottle", mods: { color: "red", size: "large" }, matches: ["o3"] },
    { text: "get me the small grey cup", type: "clear", noun: "cup", mods: { color: "grey", size: "small" }, matches: ["o2"] },
    { text: "take the yellow fork", type: "partial", noun: "fork", mods: { color: "yellow" }, matches: ["o5", "o6"] },
    { text: "hand me the plastic fork", type: "partial", noun: "fork", mods: { material: "plastic" }, matches: ["o5", "o6"] },
    { text: "hand me a fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o5", "o6", "o7"] },
    { text: "pass me a bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o3", "o4"] },
  ],
  "off-mixed-07": [
    { text: "bring me the white cup", type: "clear", noun: "cup", mods: { color: "white" }, matches: ["o3"] },
    { text: "get me the medium orange bottle", type: "clear", noun: "bottle", mods: { color: "orange", size: "medium" }, matches: ["o4"] },
    { text: "pick up the pink cup", type: "partial", noun: "cup", mods: { color: "pink" }, matches: ["o1", "o2"] },
    { text: "pass me the paper cup", type: "partial", noun: "cup", mods: { material: "paper" }, matches: ["o1", "o2"] },
    { text: "fetch my cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3"] },
    { text: "hand me the spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o7", "o8"] },
  ],
  "off-mixed-08": [
    { text: "pick up the medium black cup", type: "clear", noun: "cup", mods: { color: "black", size: "medium" }, matches: ["o1"] },
    { text: "get me the small white bottle", type: "clear", noun: "bottle", mods: { color: "white", size: "small" }, matches: ["o4"] },
    { text: "bring me the yellow spoon", type: "partial", noun: "spoon", mods: { color: "yellow" }, matches: ["o6", "o7"] },
    { text: "hand me the metal spoon", type: "partial", noun: "spoon", mods: { material: "metal" }, matches: ["o6", "o8"] },
    { text: "grab the spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o6", "o7", "o8"] },
    { text: "fetch my bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o3", "o4"] },
  ],
  "off-mixed-09": [
    { text: "get me the large red cup", type: "clear", noun: "cup", mods: { color: "red", size: "large" }, matches: ["o2"] },
    { text: "hand me the cup with a lid", type: "clear", noun: "cup", mods: { lid: true }, matches: ["o3"] },
    { text: "fetch the red cup", type: "partial", noun: "cup", mods: { color: "red" }, matches: ["o1", "o2"] },
    { text: "take the paper cup", type: "partial", noun: "cup", mods: { material: "paper" }, matches: ["o1", "o3"] },
    { text: "pass me a cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3"] },
    { text: "take the fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o6", "o7"] },
  ],
  "on-cups-01": [
    { text: "pick up the blue cup", type: "clear", noun: "cup", mods: { color: "blue" }, matches: ["o3"] },
    { text: "grab the large white cup", type: "clear", noun: "cup", mods: { color: "white", size: "large" }, matches: ["o2"] },
    { text: "hand me the white cup", type: "partial", noun: "cup", mods: { color: "white" }, matches: ["o1", "o2"] },
    { text: "bring me the small cup", type: "partial", noun: "cup", mods: { size: "small" }, matches: ["o3", "o5"] },
    { text: "pick up my cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
    { text: "hand me the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
  ],
  "on-cups-02": [
    { text: "get me the green cup", type: "clear", noun: "cup", mods: { color: "green" }, matches: ["o4"] },
    { text: "pick up the large yellow cup", type: "clear", noun: "cup", mods: { color: "yellow", size: "large" }, matches: ["o3"] },
    { text: "grab the pink cup", type: "partial", noun: "cup", mods: { color: "pink" }, matches: ["o1", "o2"] },
    { text: "pass me the small cup", type: "partial", noun: "cup", mods: { size: "small" }, matches: ["o2", "o5"] },
    { text: "bring me a cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
    { text: "get me the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
  ],
  "on-cups-03": [
    { text: "hand me the black cup", type: "clear", noun: "cup", mods: { color: "black" }, matches: ["o4"] },
    { text: "pick up the small white cup", type: "clear", noun: "cup", mods: { color: "white", size: "small" }, matches: ["o3"] },
    { text: "bring me the orange cup", type: "partial", noun: "cup", mods: { color: "orange" }, matches: ["o1", "o2"] },
    { text: "get me the paper cup", type: "partial", noun: "cup", mods: { material: "paper" }, matches: ["o3", "o4", "o5"] },
    { text: "take my cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
    { text: "pass me the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
  ],
  "on-cups-04": [
    { text: "bring me the red cup", type: "clear", noun: "cup", mods: { color: "red" }, matches: ["o3"] },
    { text: "grab the large green cup", type: "clear", noun: "cup", mods: { color: "green", size: "large" }, matches: ["o1"] },
    { text: "get me the green cup", type: "partial", noun: "cup", mods: { color: "green" }, matches: ["o1", "o2"] },
    { text: "pick up the small cup", type: "partial", noun: "cup", mods: { size: "small" }, matches: ["o2", "o5", "o6"] },
    { text: "fetch the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
    { text: "grab the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
  ],
  "on-cups-05": [
    { text: "pick up the pink cup", type: "clear", noun: "cup", mods: { color: "pink" }, matches: ["o4"] },
    { text: "hand me the small green cup", type: "clear", noun: "cup", mods: { color: "green", size: "small" }, matches: ["o6"] },
    { text: "grab the yellow cup", type: "partial", noun: "cup", mods: { color: "yellow" }, matches: ["o1", "o2"] },
    { text: "bring me the medium cup", type: "partial", noun: "cup", mods: { size: "medium" }, matches: ["o1", "o4"] },
    { text: "pick up my cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
    { text: "take the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
  ],
  "on-bottles-01": [
    { text: "pick up the green bottle", type: "clear", noun: "bottle", mods: { color: "green" }, matches: ["o3"] },
    { text: "get me the large clear bottle", type: "clear", noun: "bottle", mods: { color: "clear", size: "large" }, matches: ["o2"] },
    { text: "hand me the clear bottle", type: "partial", noun: "bottle", mods: { color: "clear" }, matches: ["o1", "o2"] },
    { text: "pass me the plastic bottle", type: "partial", noun: "bottle", mods: { material: "plastic" }, matches: ["o2", "o3"] },
    { text: "pick up my bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3"] },
    { text: "grab the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3"] },
  ],
  "on-bottles-02": [
    { text: "get me the blue bottle", type: "clear", noun: "bottle", mods: { color: "blue" }, matches: ["o3"] },
    { text: "pick up the white bottle with a lid", type: "clear", noun: "bottle", mods: { color: "white", lid: true }, matches: ["o1"] },
    { text: "take the white bottle", type: "partial", noun: "bottle", mods: { color: "white" }, matches: ["o1", "o2"] },
    { text: "hand me the plastic bottle", type: "partial", noun: "bottle", mods: { material: "plastic" }, matches: ["o1", "o2"] },
    { text: "hand me the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3"] },
    { text: "bring me a bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3"] },
  ],
  "on-bottles-03": [
    { text: "grab the orange bottle", type: "clear", noun: "bottle", mods: { color: "orange" }, matches: ["o3"] },
    { text: "pass me the small green bottle", type: "clear", noun: "bottle", mods: { color: "green", size: "small" }, matches: ["o1"] },
    { text: "bring me the green bottle", type: "partial", noun: "bottle", mods: { color: "green" }, matches: ["o1", "o2"] },
    { text: "take the plastic bottle", type: "partial", noun: "bottle", mods: { material: "plastic" }, matches: ["o1", "o2"] },
    { text: "get me the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3"] },
    { text: "take my bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3"] },
  ],
  "on-bottles-04": [
    { text: "pick up the small pink bottle", type: "clear", noun: "bottle", mods: { color: "pink", size: "small" }, matches: ["o3"] },
    { text: "grab the large yellow bottle", type: "clear", noun: "bottle", mods: { color: "yellow", size: "large" }, matches: ["o2"] },
    { text: "bring me the yellow bottle", type: "partial", noun: "bottle", mods: { color: "yellow" }, matches: ["o1", "o2"] },
    { text: "take the plastic bottle", type: "partial", noun: "bottle", mods: { material: "plastic" }, matches: ["o1", "o2"] },
    { text: "pass me the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3"] },
    { text: "fetch the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3"] },
  ],
  "on-bottles-05": [
    { text: "pick up the blue bottle", type: "clear", noun: "bottle", mods: { color: "blue" }, matches: ["o3"] },
    { text: "get me the large clear bottle", type: "clear", noun: "bottle", mods: { color: "clear", size: "large" }, matches: ["o2"] },
    { text: "hand me the clear bottle", type: "partial", noun: "bottle", mods: { color: "clear" }, matches: ["o1", "o2"] },
    { text: "pass me the glass bottle", type: "partial", noun: "bottle", mods: { material: "glass" }, matches: ["o1", "o3"] },
    { text: "pick up my bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3"] },
    { text: "grab the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o1", "o2", "o3"] },
  ],
  "on-utensils-01": [
    { text: "pick up the pink spoon", type: "clear", noun: "spoon", mods: { color: "pink" }, matches: ["o3"] },
    { text: "grab the green spoon", type: "clear", noun: "spoon", mods: { color: "green" }, matches: ["o4"] },
    { text: "bring me the grey spoon", type: "partial", noun: "spoon", mods: { color: "grey" }, matches: ["o1", "o2"] },
    { text: "get me the metal spoon", type: "partial", noun: "spoon", mods: { material: "metal" }, matches: ["o1", "o2"] },
    { text: "pick up my spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "grab the spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "on-utensils-02": [
    { text: "hand me the large black spoon", type: "clear", noun: "spoon", mods: { color: "black", size: "large" }, matches: ["o1"] },
    { text: "pick up the medium grey spoon", type: "clear", noun: "spoon", mods: { color: "grey", size: "medium" }, matches: ["o3"] },
    { text: "get me the black spoon", type: "partial", noun: "spoon", mods: { color: "black" }, matches: ["o1", "o2"] },
    { text: "pass me the metal spoon", type: "partial", noun: "spoon", mods: { material: "metal" }, matches: ["o3", "o4"] },
    { text: "hand me the spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "bring me a spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "on-utensils-03": [
    { text: "pick up the white fork", type: "clear", noun: "fork", mods: { color: "white" }, matches: ["o3"] },
    { text: "grab the red fork", type: "clear", noun: "fork", mods: { color: "red" }, matches: ["o4"] },
    { text: "hand me the grey fork", type: "partial", noun: "fork", mods: { color: "grey" }, matches: ["o1", "o2"] },
    { text: "get me the metal fork", type: "partial", noun: "fork", mods: { material: "metal" }, matches: ["o1", "o2"] },
    { text: "pick up my fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "grab the fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "on-utensils-04": [
    { text: "bring me the large pink fork", type: "clear", noun: "fork", mods: { color: "pink", size: "large" }, matches: ["o1"] },
    { text: "pick up the medium grey fork", type: "clear", noun: "fork", mods: { color: "grey", size: "medium" }, matches: ["o3"] },
    { text: "get me the pink fork", type: "partial", noun: "fork", mods: { color: "pink" }, matches: ["o1", "o2"] },
    { text: "pass me the metal fork", type: "partial", noun: "fork", mods: { material: "metal" }, matches: ["o3", "o4"] },
    { text: "hand me the fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "bring me a fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
  ],
  "on-utensils-05": [
    { text: "pick up the large white fork", type: "clear", noun: "fork", mods: { color: "white", size: "large" }, matches: ["o2"] },
    { text: "grab the pink spoon", type: "clear", noun: "spoon", mods: { color: "pink" }, matches: ["o5"] },
    { text: "hand me the white fork", type: "partial", noun: "fork", mods: { color: "white" }, matches: ["o1", "o2"] },
    { text: "get me the grey fork", type: "partial", noun: "fork", mods: { color: "grey" }, matches: ["o3", "o4"] },
    { text: "pick up my fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o1", "o2", "o3", "o4"] },
    { text: "pass me the spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o5", "o6"] },
  ],
  "on-mixed-01": [
    { text: "pick up the green cup", type: "clear", noun: "cup", mods: { color: "green" }, matches: ["o3"] },
    { text: "get me the small clear bottle", type: "clear", noun: "bottle", mods: { color: "clear", size: "small" }, matches: ["o4"] },
    { text: "hand me the white cup", type: "partial", noun: "cup", mods: { color: "white" }, matches: ["o1", "o2"] },
    { text: "bring me the paper cup", type: "partial", noun: "cup", mods: { material: "paper" }, matches: ["o2", "o3"] },
    { text: "lift my cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3"] },
    { text: "bring me the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o4", "o5"] },
  ],
  "on-mixed-02": [
    { text: "get me the yellow bottle", type: "clear", noun: "bottle", mods: { color: "yellow" }, matches: ["o3"] },
    { text: "pick up the small red cup", type: "clear", noun: "cup", mods: { color: "red", size: "small" }, matches: ["o2"] },
    { text: "grab the grey fork", type: "partial", noun: "fork", mods: { color: "grey" }, matches: ["o5", "o7"] },
    { text: "hand me the metal fork", type: "partial", noun: "fork", mods: { material: "metal" }, matches: ["o5", "o7"] },
    { text: "get my cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2"] },
    { text: "take the bottle", type: "ambiguous", noun: "bottle", mods: {}, matches: ["o3", "o4"] },
  ],
  "on-mixed-03": [
    { text: "grab the blue bottle", type: "clear", noun: "bottle", mods: { color: "blue" }, matches: ["o4"] },
    { text: "pick up the medium pink cup", type: "clear", noun: "cup", mods: { color: "pink", size: "medium" }, matches: ["o3"] },
    { text: "take the yellow cup", type: "partial", noun: "cup", mods: { color: "yellow" }, matches: ["o1", "o2"] },
    { text: "bring me the ceramic cup", type: "partial", noun: "cup", mods: { material: "ceramic" }, matches: ["o2", "o3"] },
    { text: "take the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3"] },
    { text: "pick up my spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o7", "o8"] },
  ],
  "on-mixed-04": [
    { text: "hand me the small yellow cup", type: "clear", noun: "cup", mods: { color: "yellow", size: "small" }, matches: ["o2"] },
    { text: "pick up the green bottle", type: "clear", noun: "bottle", mods: { color: "green" }, matches: ["o3"] },
    { text: "get me the grey spoon", type: "partial", noun: "spoon", mods: { color: "grey" }, matches: ["o6", "o7"] },
    { text: "bring me the metal spoon", type: "partial", noun: "spoon", mods: { material: "metal" }, matches: ["o6", "o7"] },
    { text: "bring me the spoon", type: "ambiguous", noun: "spoon", mods: {}, matches: ["o6", "o7", "o8"] },
    { text: "pick up the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2"] },
  ],
  "on-mixed-05": [
    { text: "get me the small blue cup", type: "clear", noun: "cup", mods: { color: "blue", size: "small" }, matches: ["o2"] },
    { text: "grab the red cup", type: "clear", noun: "cup", mods: { color: "red" }, matches: ["o3"] },
    { text: "hand me the blue cup", type: "partial", noun: "cup", mods: { color: "blue" }, matches: ["o1", "o2"] },
    { text: "pass me the ceramic cup", type: "partial", noun: "cup", mods: { material: "ceramic" }, matches: ["o1", "o2"] },
    { text: "bring me the cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3"] },
    { text: "lift my fork", type: "ambiguous", noun: "fork", mods: {}, matches: ["o6", "o7"] },
  ],
};
Object.assign(LOGIC, { SCENES, INSTRUCTIONS });
