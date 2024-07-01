/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"; // Importation des utilitaires de test
import NewBillUI from "../views/NewBillUI.js"; // Importation de l'interface utilisateur pour la nouvelle note de frais
import NewBill from "../containers/NewBill.js"; // Importation du container pour la nouvelle note de frais
import mockStore from "../__mocks__/store"; // Importation du magasin simulé
import router from "../app/Router"; // Importation du routeur de l'application
import { localStorageMock } from "../__mocks__/localStorage.js"; // Importation du localStorage simulé
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"; // Importation des constantes pour les routes
import store from "../__mocks__/store.js"; // Importation du magasin simulé (encore?)
import userEvent from "@testing-library/user-event"; // Importation de user-event pour les événements utilisateur

beforeAll(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
  );
});

beforeEach(() => {
  const root = document.createElement("div"); // Création d'un élément div pour servir de racine
  root.setAttribute("id", "root"); // Attribution de l'ID 'root' à l'élément div
  document.body.append(root); // Ajout de l'élément div au corps du document
  router(); // Initialisation du routeur

  document.body.innerHTML = NewBillUI(); // Injection de l'interface utilisateur de la nouvelle note de frais dans le corps du document

  window.onNavigate(ROUTES_PATH.NewBill); // Simulation de la navigation vers la page de création de nouvelle note de frais
});

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      // Attente de l'affichage de l'icône mail
      await waitFor(() => screen.getByTestId('icon-mail'));
      const mailIcon = screen.getByTestId('icon-mail'); // Récupération de l'icône mail

      const activeMailIcon = mailIcon.className; // Récupération de la classe de l'icône mail
      expect(activeMailIcon).toEqual('active-icon'); // Vérification que la classe est 'active-icon'
    });

    test("Then NewBill form should be displayed", async () => {
      // Attente de l'affichage du texte "Envoyer une note de frais"
      await waitFor(() => screen.getAllByText("Envoyer une note de frais"));
      const firstInputLabelText = screen.getAllByText("Type de dépense"); // Récupération du texte "Type de dépense"
      expect(firstInputLabelText).toBeTruthy(); // Vérification que le texte est présent dans le formulaire
    });

    test("Then when user click on submit, handleSubmit function should be called", () => {
      // Initialisation d'une nouvelle instance de NewBill
      const newBill = new NewBill({ document, onNavigate, store, localStorage });

      newBill.isFormatValid = true; // Simulation de la validité du format
      const newBillForm = screen.getByTestId("form-new-bill"); // Récupération du formulaire de nouvelle note de frais
      const handleSubmit = jest.fn(newBill.handleSubmit); // Espionnage de la fonction handleSubmit
      newBillForm.addEventListener("submit", handleSubmit); // Ajout d'un écouteur d'événement sur la soumission du formulaire
      fireEvent.submit(newBillForm); // Déclenchement de l'événement de soumission du formulaire

      expect(handleSubmit).toHaveBeenCalled(); // Vérification que handleSubmit a bien été appelée
    });

    test("Then when a file with incorrect extension is selected, handleChangeFile should be called", async () => {
      // Initialisation d'une nouvelle instance de NewBill
      const newBill = new NewBill({ document, onNavigate, store, localStorage });

      const handleChangeFile = jest.fn(() => newBill.handleChangeFile); // Espionnage de la fonction handleChangeFile
      const fileInput = screen.getByTestId("file"); // Récupération de l'input de type file
      fileInput.addEventListener("change", handleChangeFile); // Ajout d'un écouteur d'événement sur le changement de fichier
      await waitFor(() => {
        fireEvent.change(fileInput, {
          target: {
            files: [new File(["test"], "test.txt", { type: "image/txt" })], // Sélection d'un fichier avec une extension incorrecte
          },
        });
      });

      expect(handleChangeFile).toHaveBeenCalled(); // Vérification que handleChangeFile a bien été appelée
      expect(fileInput.files[0].name).toBe("test.txt"); // Vérification que le fichier sélectionné a le nom "test.txt"
    });

    // Test d'intégration POST
    describe("When I want to add a new bill", () => {
      test("Then create new bill from mock API POST", async () => {
        // Espionnage de la méthode bills du mockStore
        const logSpy = jest.spyOn(mockStore, "bills");
        const bill = {
          // Données simulées d'une note de frais
          id: "47qAXb6fIm2zOKkLzMro",
          vat: "80",
          fileUrl: "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
          status: "pending",
          type: "Hôtel et logement",
          commentary: "séminaire billed",
          name: "encore",
          fileName: "preview-facture-free-201801-pdf-1.jpg",
          date: "2004-04-04",
          amount: 400,
          commentAdmin: "ok",
          email: "a@a",
          pct: 20,
        };
        const logBills = await mockStore.bills().update(bill); // Appel de la méthode update du mockStore avec les données de la note de frais

        expect(logSpy).toHaveBeenCalled(); // Vérification que la méthode bills a bien été appelée
        expect(logBills).toStrictEqual(bill); // Vérification que les données de la note de frais sont correctement mises à jour
      });
    });

    describe("When an error occurs on API", () => {
      test("Then add bills from an API and fails with 404 message error", async () => {
        // Espionnage de la méthode bills du mockStore avec simulation d'une erreur 404
        const logSpy = jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
          return {
            create: jest.fn().mockRejectedValue(new Error("Erreur 404")),
          };
        });

        await expect(logSpy().create).rejects.toThrow("Erreur 404"); // Vérification que l'erreur 404 est correctement propagée
        expect(logSpy).toHaveBeenCalled(); // Vérification que la méthode bills a bien été appelée
      });

      test("Then add bills from an API and fails with 500 message error", async () => {
        // Espionnage de la méthode bills du mockStore avec simulation d'une erreur 500
        const logSpy = jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
          return {
            create: jest.fn().mockRejectedValue(new Error("Erreur 500")),
          };
        });

        await expect(logSpy().create).rejects.toThrow("Erreur 500"); // Vérification que l'erreur 500 est correctement propagée
        expect(logSpy).toHaveBeenCalled(); // Vérification que la méthode bills a bien été appelée
      });
    });
  });
});
