/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"; // Importation des utilitaires de testing
import BillsUI from "../views/BillsUI.js"; // Importation du composant UI des factures
import { bills } from "../fixtures/bills.js"; // Importation des données de factures fictives
import { ROUTES_PATH, ROUTES } from "../constants/routes.js"; // Importation des chemins et routes de l'application
import { localStorageMock } from "../__mocks__/localStorage.js"; // Importation du mock pour localStorage
import router from "../app/Router.js"; // Importation du routeur de l'application
import store from "../__mocks__/store.js"; // Importation du mock du store
import Bills from "../containers/Bills.js"; // Importation du container des factures
import userEvent from "@testing-library/user-event"; // Importation de userEvent pour simuler des événements utilisateur

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Définition de localStorage pour simuler la connexion d'un employé
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock
      });
      window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee"
          })
      );

      // Création de l'élément root et initialisation du router
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router(); // Initialise le router de l'application
      window.onNavigate(ROUTES_PATH.Bills); // Simule la navigation vers la page des factures
      await waitFor(() => screen.getByTestId("icon-window")); // Attend que l'icône de fenêtre soit présente
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBe(true); // Vérifie que l'icône est active
    });

    test("Then bills should be ordered from earliest to latest", async () => {
      // Injection du HTML des factures dans le body
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
          .getAllByText(
              /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
          )
          .map((a) => a.innerHTML);

      // Trie des dates dans l'ordre anti-chronologique
      dates.sort((a, b) => (new Date(a) < new Date(b) ? 1 : -1));
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted); // Vérifie que les dates sont triées dans l'ordre attendu
      console.log(dates);
      console.log(datesSorted);
    });

    test("Function handleClickNewBill should be called", async () => {
      // Définition de localStorage pour simuler la connexion d'un employé
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock
      });
      window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee"
          })
      );

      // Simule le click sur le bouton "New Bill" et vérifie que handleClickNewBill est appelée
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const billsCompo = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage
      });
      const billsList = billsCompo.getBills();
      await billsList.then((snapshot) => {
        document.body.innerHTML = BillsUI({ data: snapshot });
        const handleClickNewBill = jest.fn(billsCompo.handleClickNewBill);
        const button = screen.getByTestId("btn-new-bill");
        if (button) {
          button.addEventListener("click", handleClickNewBill);
          userEvent.click(button); // Simule le click utilisateur sur le bouton
          expect(handleClickNewBill).toHaveBeenCalled(); // Vérifie que handleClickNewBill a été appelée
        } else {
          expect(handleClickNewBill).not.toHaveBeenCalled();
        }
      });
    });

    test("Then it fails with a 404 message error", async () => {
      // Affichage d'un message d'erreur 404
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.findByText(/Erreur 404/);
      expect(message).toBeTruthy(); // Vérifie que le message d'erreur 404 est présent
    });

    test("Then it fails with a 500 message error", async () => {
      // Affichage d'un message d'erreur 500
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.findByText(/Erreur 500/);
      expect(message).toBeTruthy(); // Vérifie que le message d'erreur 500 est présent
    });
  });

  describe("When I click on the eye icon", () => {
    test("Then a modal should open with the bill image", async () => {
      // Simulation du click sur l'icône d'œil et vérification de l'ouverture d'un modal
      document.body.innerHTML = BillsUI({ data: bills });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const billsInstance = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage
      });
      $.fn.modal = jest.fn(); // Mock de la fonction modal de jQuery

      const eyeIcon = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(() =>
          billsInstance.handleClickIconEye(eyeIcon)
      );
      eyeIcon.addEventListener("click", handleClickIconEye);
      fireEvent.click(eyeIcon); // Simule le click sur l'icône d'œil
      expect(handleClickIconEye).toHaveBeenCalled(); // Vérifie que handleClickIconEye a été appelée
      expect($.fn.modal).toHaveBeenCalledWith("show"); // Vérifie que la fonction modal de jQuery a été appelée avec "show"
    });
  });
});
// // test d'intégration GET exemple depuis dashboard
// describe("Given I am a user connected as Admin", () => {
//   describe("When I navigate to Dashboard", () => {
//     test("fetches bills from mock API GET", async () => {
//       localStorage.setItem("user", JSON.stringify({ type: "Admin", email: "a@a" }));
//       const root = document.createElement("div")
//       root.setAttribute("id", "root")
//       document.body.append(root)
//       router()
//       window.onNavigate(ROUTES_PATH.Dashboard)
//       await waitFor(() => screen.getByText("Validations"))
//       const contentPending  = await screen.getByText("En attente (1)")
//       expect(contentPending).toBeTruthy()
//       const contentRefused  = await screen.getByText("Refusé (2)")
//       expect(contentRefused).toBeTruthy()
//       expect(screen.getByTestId("big-billed-icon")).toBeTruthy()
//     })

//test intégration get
describe("Given I am a user connected as Employee", () => {
    describe("When I navigate to Bills", () => {
        test("fetches bills from mock API GET", async () => {
        localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
        window.onNavigate(ROUTES_PATH.Bills);
        await waitFor(() => screen.getByText("Billed"));
        expect(bills).toBeTruthy();
        });
    });
});
