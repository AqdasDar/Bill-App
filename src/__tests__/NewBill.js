/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";
import BillsUI from "../views/BillsUI.js";

//mock de la fonction de routage
const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
window.localStorage.setItem('user', JSON.stringify({
  type: 'Employee'
}));

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then new bill icon in vertical layout should be highlighted",  () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      const windowIcon = screen.getByTestId('icon-mail');
      expect(windowIcon.classList.contains('active-icon')).toBe(true);
    });
  });
  // Champs vides
  describe("when I am on Bill Page and I do not fill fields", () =>{
    test("Then the click on send button should render newBill page", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      document.body.innerHTML = NewBillUI();
      window.onNavigate(ROUTES_PATH.NewBill);

      const newBill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      });
      const formNewBill = screen.getByTestId('form-new-bill');
      const handleSubmit = jest.fn(newBill.handleSubmit);
      formNewBill.addEventListener('submit', handleSubmit);

      await waitFor(() => fireEvent.submit(formNewBill));
      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });
  // Test du chargement du fichier au mauvais format
  describe("when I am on Bill Page and I choose a bad format of file",() => {
    test("Then an error message should be displayed", async () =>{
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      document.body.innerHTML = NewBillUI();
      window.onNavigate(ROUTES_PATH.NewBill);

      const newBill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      });

      const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
      const input = screen.getByTestId("file");
      input.addEventListener("change", handleChangeFile);
      const textFile = new File(["text"], "filename.txt", { type: 'text/html' });
      await waitFor(() => fireEvent.change(input, {target : {files:[textFile]}}));
      expect(handleChangeFile).toHaveBeenCalled();
      const errorMessage = screen.getByTestId("icon-mail");
      const styles = getComputedStyle(errorMessage);
      expect(styles.display).toBe('block');
    });
  });
  // Test du chargement du fichier au bon format
  describe("when I am on Bill Page and I choose a good format of file",() => {
    test("Then the file should be uploaded", async () =>{
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      document.body.innerHTML = NewBillUI();
      window.onNavigate(ROUTES_PATH.NewBill);

      const newBill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      });

      const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
      const input = screen.getByTestId("file");
      input.addEventListener("change", handleChangeFile);
      const file = new File(["img"], "nom.jpg", {
        type: "image/jpg",
      });
      await waitFor(() => fireEvent.change(input, {target : {files:[file]}}));
      expect(handleChangeFile).toHaveBeenCalled();
      expect(input.files[0].name).toBe("nom.jpg");
    });
  });
  // Test d'intégration POST new bill
  describe("When I Submit a valid bill form", () => {
    test("then a bill is created", async () => {

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      document.body.innerHTML = NewBillUI();
      window.onNavigate(ROUTES_PATH.NewBill);

      const newBill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      });

      const inputData = bills[0];
      const formNewBill = screen.getByTestId('form-new-bill');
      // Récupérer les différents champs de l'interface
      const expenseType = screen.getByTestId("expense-type");
      const expenseName = screen.getByTestId("expense-name");
      const amount = screen.getByTestId("amount");
      const date = screen.getByTestId("datepicker");
      const vat = screen.getByTestId("vat");
      const pct = screen.getByTestId("pct");
      const commentary = screen.getByTestId("commentary");
      const input = screen.getByTestId("file");
      const file = new File(["img"], inputData.fileName, {
        type: "image/jpg",
      });

      // Remplir les champs à partir d'inputData et s'assurer de leur validité
      userEvent.selectOptions(expenseType, screen.getByRole('option', {name: inputData.type}));
      expect(screen.getByRole('option', {name: inputData.type}).selected).toBe(true);

      fireEvent.change(expenseName, { target: { value: inputData.name } });
      expect(expenseName.value).toBe(inputData.name);

      fireEvent.change(amount, { target: { value: inputData.amount } });
      expect(amount.value).toBe(inputData.amount.toString());

      fireEvent.change(date, { target: { value: inputData.date } });
      expect(date.value).toBe(inputData.date);

      fireEvent.change(vat, { target: { value: inputData.vat } });
      expect(vat.value).toBe(inputData.vat);

      fireEvent.change(pct, { target: { value: inputData.pct } });
      expect(pct.value).toBe(inputData.pct.toString());

      fireEvent.change(commentary, { target: { value: inputData.commentary } });
      expect(commentary.value).toBe(inputData.commentary);

      userEvent.upload(input, file);

      // Soumettre le formulaire
      const handleSubmit = jest.fn(newBill.handleSubmit);
      formNewBill.addEventListener('submit', handleSubmit);
      await waitFor(() => fireEvent.submit(formNewBill));
      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });
});
describe("Given I am connected as an employee", () => {
  describe("When the form is submitted", ()=>{
    test("Then, it should render 'mes notes de frais' page, ", async () => {
      const onNavigate = pathname => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Wait for the form to be available in the DOM
      let form;
      await waitFor(() => {
        form = screen.getByTestId("form-new-bill");
        expect(form).toBeInTheDocument();
      });

      const testHandleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      form.addEventListener("submit", testHandleSubmit);
      fireEvent.submit(form);

      expect(testHandleSubmit).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });
});

/* test d'intégration 404 500 */
describe('test d\'intégration POST', () => {
  test('fetches bills from mock API POST', async () => {
    const postSpy = jest.spyOn(mockStore.bills(), 'create');
    const postBill = await mockStore.bills().create();
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postBill.data.length).toBe(4);
  });
  describe('When I navigate to Bills page', () => {
    test('fetches bills from an API and fails with 500 message error', async () => {
      // Render the UI
      const html = BillsUI({ error: 'Erreur 500' });
      document.body.innerHTML = html;

      // Wait for the input element to be available in the DOM
      const input = await waitFor(() => screen.getByTestId("file"))

      // Then you can interact with input.files
        // ...

      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
  describe('When I navigate to Bills page', () => {
    test('fetches bills from an API and fails with 404 message error', async () => {
      // Render the UI
      const html = BillsUI({ error: 'Erreur 404' });
      document.body.innerHTML = html;

      // Wait for the input element to be available in the DOM
      const input = await waitFor(() => screen.getByTestId("file"))

      // Then you can interact with input.files
      // ...

      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
  });
});
