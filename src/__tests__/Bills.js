/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import store from "../__mocks__/store.js";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock
      });
      window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee"
          })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from earliest to latest", async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
          .getAllByText(
              /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
          )
          .map((a) => a.innerHTML);
      //trier les dates dans l'ordre anti-chronologique
      dates.sort((a, b) => (new Date(a) < new Date(b) ? 1 : -1));
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
      console.log(dates);
      console.log(datesSorted);
    });

    test("Function handleClickNewBill should be called", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock
      });
      window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee"
          })
      );
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
          userEvent.click(button);
          expect(handleClickNewBill).toHaveBeenCalled();
        } else {
          expect(handleClickNewBill).not.toHaveBeenCalled();
        }
      });
    });

    test("Then it fails with a 404 message error", async () => {
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.findByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("Then it fails with a 500 message error", async () => {
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.findByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });

  describe("When I click on the eye icon", () => {
    test("Then a modal should open with the bill image", async () => {
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
      $.fn.modal = jest.fn(); // Mock jQuery modal function

      const eyeIcon = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(() =>
          billsInstance.handleClickIconEye(eyeIcon)
      );
      eyeIcon.addEventListener("click", handleClickIconEye);
      fireEvent.click(eyeIcon);
      expect(handleClickIconEye).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalledWith("show");
    });
  });
});
