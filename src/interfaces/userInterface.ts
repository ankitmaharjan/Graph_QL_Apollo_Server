// User Interface
export interface UserInterface {
    id: string;
    username: string;
    email: string;
    password: string; // Note: It's recommended not to include the password in this interface for security reasons, but I've included it here to match your existing code.
  }
  

export interface SignupInterface {
    username: string;
    email: string;
    password: string;
}
export interface LoginInterface {
    username: string;
    password: string;
}

​export interface updateUserInterface {
    id: string;
    username?: string;
    email?: string;
}
​
export interface deleteInterface {
    id: string;
}
​
export interface updatePasswordInterface {
    id: string;
    newPassword: string
}
​



// export interface forgetPasswordInterface{
//     email: string;
// }
// // export interface ResetPasswordInterface{
// //     email: string;
// //     token: string;
// //     newPassword: string;
// // }

