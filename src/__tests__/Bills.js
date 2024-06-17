/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import router from "../app/Router.js";
import store from "../app/Store.js";
import Bills from "../containers/Bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
        expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      //trier les dates dans l'ordre anti-chronologique
      dates.sort((a, b) => (new Date(a) < new Date(b) ? 1 : -1))
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})
describe("When I click on the new bill button", () => {
  test("Then it should navigate to NewBill page", () => {
    document.body.innerHTML = BillsUI({ data: bills });
    const onNavigate = (pathname) => { document.body.innerHTML = pathname; };
    const billsInstance = new Bills({ document, onNavigate, store, localStorage: window.localStorage });
    const handleClickNewBill = jest.fn(billsInstance.handleClickNewBill);
    const buttonNewBill = screen.getByTestId('btn-new-bill');
    buttonNewBill.addEventListener('click', handleClickNewBill);
    fireEvent.click(buttonNewBill);
    expect(handleClickNewBill).toHaveBeenCalled();
    expect(document.body.innerHTML).toEqual(ROUTES_PATH.NewBill);
  });
});
describe("When I click on the eye icon", () => {
  test("Then a modal should open with the bill image", async () => {
    document.body.innerHTML = BillsUI({ data: bills });
    const onNavigate = (pathname) => { document.body.innerHTML = pathname; };
    const billsInstance = new Bills({ document, onNavigate, store, localStorage: window.localStorage });
    $.fn.modal = jest.fn(); // Mock jQuery modal function

    const eyeIcon = screen.getAllByTestId('icon-eye')[0];
    const handleClickIconEye = jest.fn(() => billsInstance.handleClickIconEye(eyeIcon));
    eyeIcon.addEventListener('click', handleClickIconEye);
    fireEvent.click(eyeIcon);
    expect(handleClickIconEye).toHaveBeenCalled();
    expect($.fn.modal).toHaveBeenCalledWith('show');
  });
});
//const pureBills = await mockedBills.bills().list();
//       const orderedPureBills = pureBills.sort((a, b) => a.date < b.date ? -1 : 1);
//       const orderedPureBillsName = Object.values(orderedPureBills.map(bill => bill.name));
//
//       const billsContainer = new Bills({
//         document: document,
//         onNavigate: onNavigate,
//         store: mockedBills,
//         localStorage: window.localStorage
//       })
//
//       const treatedBills = await billsContainer.getBills();
//       document.body.innerHTML = BillsUI({data: treatedBills});
//
//       const renderedBillsNames = screen.getAllByTestId('bill-row-name').map(billItemNameElement => billItemNameElement.textContent);
//
//       expect(renderedBillsNames).toEqual(orderedPureBillsName);
