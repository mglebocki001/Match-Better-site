# Weryfikacja adresu e-mail

Rejestracja przez e-mail wymaga teraz potwierdzenia adresu przed korzystaniem z konta.

## Przebieg
1. Użytkownik zakłada konto e-mail + hasło.
2. Firebase wysyła wiadomość weryfikacyjną w języku polskim.
3. Konto pozostaje zablokowane w interfejsie do czasu `emailVerified === true`.
4. Użytkownik może ponownie wysłać wiadomość lub sprawdzić status po kliknięciu linku.
5. Logowanie przez Google pozostaje dostępne bez dodatkowej weryfikacji adresu, ponieważ dostawcą tożsamości jest Google.

## Firebase Console
- Security > Authentication > Sign-in method: włącz Email/Password.
- Security > Authentication > Templates: ustaw nadawcę, nazwę aplikacji i treść e-maila weryfikacyjnego.
- Authentication > Settings > Authorized domains: upewnij się, że `matchbetter.com.pl` jest dodana do dozwolonych domen.

## Ważne dla backendu
Frontend blokuje dostęp dla niezweryfikowanych kont, ale backend powinien dodatkowo sprawdzać po zweryfikowaniu tokenu Firebase, czy `email_verified` jest prawdziwe, zanim dopuści do operacji wymagających konta (np. analiza, raporty, płatności).
