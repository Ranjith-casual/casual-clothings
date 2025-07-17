export const validURLConvert = (name) => {

    const url = name.toString().replaceAll(" ","-").replaceAll(",","").replaceAll("&","").replaceAll("(","").replaceAll(")","").replaceAll(".","").replaceAll("/","-")

    return url;
}