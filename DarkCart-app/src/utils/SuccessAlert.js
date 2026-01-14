import Swal from "sweetalert2";

const SuccessAlert=(title)=>{
 const alert =   Swal.fire({
  title: title,
  icon: "success",
 
  confirmButtonColor: "#00b050", // Set button color to red
      });
      return alert
}
export default SuccessAlert
// import Swal from "sweetalert2";