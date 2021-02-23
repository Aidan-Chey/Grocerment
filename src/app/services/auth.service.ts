import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';
import firebase from 'firebase/app';
import { auth } from 'firebaseui';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly _loadingAuth = new BehaviorSubject<Boolean>(false);
  public readonly loadingAuth$ = this._loadingAuth.asObservable();
  public authContainerRef!: Element;

  public readonly authUiConfig = {
    callbacks: {
      // signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      //   // User successfully signed in.
      //   // Return type determines whether we continue the redirect automatically
      //   // or whether we leave that to developer to handle.
      //   return true;
      // },
      uiShown: () => {
        // The widget is rendered.
        // Hide the loader.
        this._loadingAuth.next(false);
      }
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    signInSuccessUrl: '/need',
    signInOptions: [
      // Leave the lines as is for the providers you want to offer your users.
      { provider: firebase.auth.EmailAuthProvider.PROVIDER_ID, requireDisplayName: false },
      { provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID, requireDisplayName: false },
      { provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID, requireDisplayName: false },
    ],
    // Terms of service url.
    // tosUrl: '<your-tos-url>',
    // Privacy policy url.
    // privacyPolicyUrl: '<your-privacy-policy-url>'
  };

  constructor() {}

  public signIn() {
    if ( !this.authContainerRef ) throw Error('Can\'t begin authentication process, no container element for UI');
    // Render the loading indicator
    this._loadingAuth.next(true);
    // Initalize the login process
    const ui = new auth.AuthUI(firebase.auth());
    // Start the login process
    ui.start( this.authContainerRef, this.authUiConfig );
  }

  public signOut() {
    firebase.auth().signOut();
  }

  public notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
  }

}
