import Swal from 'sweetalert2'

import { submitUserFeedback} from './Places';

export function showFeedbackAlert(props){
  
  Swal.fire({
    title: 'How is this place?',
    icon: 'question',
    showCloseButton: true,
    allowEnterKey: false,
    // Button 1
    showConfirmButton: true,
    confirmButtonText: 'Empty',
    confirmButtonColor: '#75c74c',
    // Button 2
    showDenyButton: true,
    denyButtonText: 'Moderate',
    denyButtonColor: '#eebb3e',
    // Button 3
    showCancelButton: true,
    cancelButtonText: `It's Full`,
    cancelButtonColor: '#df5f57',
    html: `
        You are in <b>${props.place}</b>
        <br/>
        ${props.address}`
  }).then((result) => {
      // Button 1
    if (result.isConfirmed) {
      submitUserFeedback(props.username, 1);
    } // Button 2
    else if (result.isDenied) {   
      submitUserFeedback(props.username, 2);
    } // Button 3
    else if (result.isDismissed && result.dismiss==='cancel') {
      submitUserFeedback(props.username, 3);
    }
  });
};

export function showErrorAlert(){
  Swal.fire({
    title: 'There was an error submitting your feedback',
    text: 'Please try again',
    icon: 'error',
    allowEnterKey: false,
    confirmButtonText: 'Close',
    confirmButtonColor: '#aaa'
  })
};

export function showSuccessAlert(){
  Swal.fire({
    title: 'Thanks for your feedback!',
    text: 'You can close this window now',
    icon: 'success',
    allowEnterKey: false,
    confirmButtonText: 'Close',
    confirmButtonColor: '#aaa'
  });
};

export function showLoadingAlert(){
    Swal.fire({
        text: 'Loading...',
        showConfirmButton: false,
        showCloseButton: false,
        allowEnterKey: false,
        showCancelButton: false
      });
};

export function closeAlert(){
    Swal.close();
};