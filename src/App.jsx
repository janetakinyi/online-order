import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const DEFAULT_DISCOUNT = 30;

const books = [
  {
    isbn: "9780195738315",
    title: "My Picture Word Book",
    price: 649.6,
  },
  {
    isbn: "9780195739053",
    title: "Kitabu Changu Cha Picha",
    price: 649.6,
  },
  {
    isbn: "9789914445817",
    title: "Fun Start Handwriting Workbook 1 PP1",
    price: 464.0,
  },
  {
    isbn: "9789914445824",
    title: "Fun Start Handwriting Workbook 2 PP1",
    price: 464.0,
  },
  {
    isbn: "9789914445831",
    title: "Fun Start Handwriting Workbook 3 PP2",
    price: 464.0,
  },
  {
    isbn: "9789914445848",
    title: "Fun Start Handwriting Workbook 4 PP2",
    price: 464.0,
  },
];

export default function OUPOrderPortal() {
  const formatKES = (amount) =>
    Number(amount).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const [discountPercent, setDiscountPercent] =
    useState(DEFAULT_DISCOUNT);

  const [searchTerm, setSearchTerm] = useState("");

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    town: "",
    address: "",
  });

  const [cart, setCart] = useState([]);

  const [orderDate] = useState(
    new Date().toLocaleDateString("en-KE")
  );

  const [poNumber, setPoNumber] = useState("");

  const filteredBooks = useMemo(() => {
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn.includes(searchTerm)
    );
  }, [searchTerm]);

  const addBook = (book) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.isbn === book.isbn);

      if (exists) {
        return prev.map((item) =>
          item.isbn === book.isbn
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...book, quantity: 1 }];
    });
  };

  const updateQty = (isbn, qty) => {
    setCart((prev) =>
      prev.map((item) =>
        item.isbn === isbn
          ? {
              ...item,
              quantity: Math.max(1, Number(qty) || 1),
            }
          : item
      )
    );
  };

  const removeItem = (isbn) => {
    setCart((prev) =>
      prev.filter((item) => item.isbn !== isbn)
    );
  };

  const resetDiscount = () => {
    setDiscountPercent(DEFAULT_DISCOUNT);
  };

  const resetForm = () => {
    setCustomer({
      name: "",
      phone: "",
      email: "",
      town: "",
      address: "",
    });

    setCart([]);
    setSearchTerm("");
    setDiscountPercent(DEFAULT_DISCOUNT);
    setPoNumber("");
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discount = subtotal * (discountPercent / 100);

  const grandTotal = subtotal - discount;

  const printOrder = () => {
    const printable = document.getElementById("printable-order");

    if (!printable) {
      alert("Nothing to print.");
      return;
    }

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <html>
        <head>
          <title>OUP Order Form</title>
          <style>
            body{
              font-family:Arial,sans-serif;
              padding:20px;
            }
            table{
              width:100%;
              border-collapse:collapse;
            }
            table,th,td{
              border:1px solid #000;
            }
            th,td{
              padding:8px;
              text-align:left;
            }
          </style>
        </head>
        <body>
          ${printable.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const generatePDF = () => {
    if (cart.length === 0) {
      alert("Please add books first");
      return;
    }

    if (!poNumber.trim()) {
      alert("Please enter a PO Number");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Oxford University Press East Africa", 14, 20);

    doc.setFontSize(14);
    doc.text("ORDER FORM", 14, 30);

    doc.setFontSize(11);
    doc.text(`Date: ${orderDate}`, 14, 40);
    doc.text(`PO Number: ${poNumber}`, 14, 48);
    doc.text(`Customer: ${customer.name}`, 14, 56);
    doc.text(`Phone: ${customer.phone}`, 14, 64);
    doc.text(`Email: ${customer.email}`, 14, 72);
    doc.text(`Town: ${customer.town}`, 14, 80);

    autoTable(doc, {
      startY: 92,
      head: [[
        "ISBN",
        "QTY",
        "Title",
        "Unit Price",
        "Amount"
      ]],
      body: cart.map((item) => [
        item.isbn,
        item.quantity,
        item.title,
        formatKES(item.price),
        formatKES(item.price * item.quantity),
      ]),
    });

    const finalY = (doc.lastAutoTable?.finalY || 100) + 15;

    doc.text(
      `Subtotal: KES ${formatKES(subtotal)}`,
      14,
      finalY
    );

    doc.text(
      `Discount (${discountPercent.toFixed(2)}%): KES ${formatKES(discount)}`,
      14,
      finalY + 10
    );

    doc.text(
      `Grand Total: KES ${formatKES(grandTotal)}`,
      14,
      finalY + 20
    );

    doc.save(`OUP_Order_${poNumber}.pdf`);
  };

  const downloadExcel = () => {
    if (cart.length === 0) {
      alert("Please add books first");
      return;
    }

    if (!poNumber.trim()) {
      alert("Please enter a PO Number");
      return;
    }

    const workbook = XLSX.utils.book_new();

    const sheetData = [
      ["OUP ORDER FORM"],
      [],
      ["Date", orderDate],
      ["PO Number", poNumber],
      ["Customer Name", customer.name],
      ["Phone", customer.phone],
      ["Email", customer.email],
      ["Town", customer.town],
      ["Address", customer.address],
      [],
      ["ISBN", "Quantity", "Title", "Unit Price", "Amount"],
      ...cart.map((item) => [
        item.isbn,
        item.quantity,
        item.title,
        item.price,
        item.quantity * item.price,
      ]),
      [],
      ["", "", "", "Subtotal", subtotal],
      ["", "", "", `Discount (${discountPercent.toFixed(2)}%)`, discount],
      ["", "", "", "Grand Total", grandTotal],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 10 },
      { wch: 55 },
      { wch: 15 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Order");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(file, `OUP_Order_${poNumber}.xlsx`);
  };


  return (
    <div className="container">
      <h1>Oxford University Press East Africa</h1>
      <h2>Online Order Portal</h2>

      <div className="card">
        <h3>Order Information</h3>

        <div className="grid">
          <input value={orderDate} readOnly />

          <input
            type="text"
            placeholder="Enter PO Number"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <h3>Customer Details</h3>

        <div className="grid">
          <input
            placeholder="Customer Name"
            value={customer.name}
            onChange={(e) =>
              setCustomer({
                ...customer,
                name: e.target.value,
              })
            }
          />

          <input
            placeholder="Phone"
            value={customer.phone}
            onChange={(e) =>
              setCustomer({
                ...customer,
                phone: e.target.value,
              })
            }
          />

          <input
            placeholder="Email"
            value={customer.email}
            onChange={(e) =>
              setCustomer({
                ...customer,
                email: e.target.value,
              })
            }
          />

          <input
            placeholder="Town"
            value={customer.town}
            onChange={(e) =>
              setCustomer({
                ...customer,
                town: e.target.value,
              })
            }
          />

          <textarea
            placeholder="Address"
            rows="3"
            value={customer.address}
            onChange={(e) =>
              setCustomer({
                ...customer,
                address: e.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="card">
        <input
          type="text"
          placeholder="Search by ISBN or Book Title"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="books">
          {filteredBooks.map((book) => (
            <div key={book.isbn} className="book">
              <strong>{book.title}</strong>

              <p>{book.isbn}</p>

              <p>KES {formatKES(book.price)}</p>

              <button onClick={() => addBook(book)}>
                Add
              </button>
            </div>
          ))}
        </div>
      </div>

      <div
        id="printable-order"
        className="card"
      >
        <h3>Shopping Cart</h3>

        <table>
          <thead>
            <tr>
              <th>ISBN</th>
              <th>Title</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {cart.map((item) => (
              <tr key={item.isbn}>
                <td>{item.isbn}</td>

                <td>{item.title}</td>

                <td>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQty(
                        item.isbn,
                        e.target.value
                      )
                    }
                  />
                </td>

                <td>
                  {formatKES(item.price)}
                </td>

                <td>
                  {formatKES(
                    item.quantity *
                      item.price
                  )}
                </td>

                <td>
                  <button
                    onClick={() =>
                      removeItem(item.isbn)
                    }
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="summary">
          <label>Discount %</label>

          <input
            type="number"
            value={discountPercent}
            onChange={(e) =>
              setDiscountPercent(
                Number(e.target.value)
              )
            }
          />

          <button
            onClick={resetDiscount}
          >
            Reset Discount
          </button>

          <h3>
            Subtotal: KES{" "}
            {formatKES(subtotal)}
          </h3>

          <h3>
            Discount: KES{" "}
            {formatKES(discount)}
          </h3>

          <h2>
            Grand Total: KES{" "}
            {formatKES(grandTotal)}
          </h2>
        </div>
      </div>

      <div className="buttons">
        <button onClick={generatePDF}>
          Download PDF
        </button>

        <button onClick={downloadExcel}>
          Download Excel
        </button>

        <button onClick={printOrder}>
          Print
        </button>

        <button onClick={resetForm}>
          Reset Form
        </button>
      </div>
    </div>
  );
}
