const falsyCheck = equals => (p, c) => {

  // both falsy 
  if (!p && !c) {
    return p === c;
  }

  // one of input is falsy
  if (!p || !c) {
    return false;
  }
 
  return equals(p, c)
}

export default falsyCheck;