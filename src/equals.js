const equals = (p1, p2) => {
  if (p1[0] === p2[0]) {
    if (p1[1] === p2[1]) {
      return true
    } else {
      return false
    }
  }
  return false
}

export default equals
