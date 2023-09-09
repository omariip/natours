/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
export const bookTour = async tourId => {
  try {
    const stripe = Stripe(
      'pk_test_51NmkqZKLmvvEA6zMbVD83m9nqLFrnMx8oeNzzqnIu7VJnz8KodMYoNredqu4s3yge5tlgWdpzdqviTDkgSbTNCRW00iQXJPKsJ'
    );
    // 1) get checkout session from api
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    // console.log(session);
    // 2) create checkout form + charge the credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (error) {
    console.log(err);
    showAlert('error', err);
  }
};
