module.exports = {
  //-----------------------------------------------------------------------------------------//
  formatarData: date => {
    if (date == null) date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var segundos = date.getSeconds();
    var ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    segundos = segundos < 10 ? "0" + segundos : segundos;
    var strTime = hours + ":" + minutes + ":" + segundos + " " + ampm;
    return (
      date.getDate() +
      "/" +
      (date.getMonth() + 1) +
      "/" +
      date.getFullYear() +
      "  " +
      strTime
    );
  },
  //-----------------------------------------------------------------------------------------//
  dataParaInput: () => {
    const agora = new Date();
    var d = agora.getDate();
    var m = agora.getMonth() + 1;
    var y = agora.getFullYear();
    if (d < 10) d = "0" + d;
    if (m < 10) m = "0" + m;
    return y + "-" + m + "-" + d;
  }
  //-----------------------------------------------------------------------------------------//
};
