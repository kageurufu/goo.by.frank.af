let kitCount = 1;
let kitWeight = 3 / 16; // 3oz, in lbs
let kitPrice = 20;

const inputKitCount = document.getElementById("kit-count");

const elemOrderPrice = document.getElementById("order--price");
const elemShippingUS = document.getElementById("shipping--us");
const elemShippingCA = document.getElementById("shipping--ca");
const elemShippingWorld = document.getElementById("shipping--world");

inputKitCount.addEventListener("change", function (e) {
  kitCount = e.target.value;

  updateOrderEstimate();
});

function updateOrderEstimate() {
  const usShipping = getShipping("US", kitCount * kitWeight);
  const caShipping = getShipping("CA", kitCount * kitWeight);
  const worldShipping = getShipping("world", kitCount * kitWeight);

  elemOrderPrice.innerText = "$" + (20 * kitCount).toString();
  elemShippingUS.innerText = "$" + usShipping.price.toString();
  elemShippingCA.innerText = "$" + caShipping.price.toString();
  elemShippingWorld.innerText = "$" + worldShipping.price.toString();
}

function getShipping(country, weightInLb) {
  switch (country) {
    case "US":
      return { id: "SHIP_US", label: "USPS Priority (2-5 day)", price: 4 };

    case "CA":
      return {
        id: "SHIP_CA",
        label: "International Economy (1-3+ Week)",
        price:
          weightInLb < 0.25
            ? 9
            : weightInLb < 1
            ? 11
            : weightInLb < 2
            ? 15
            : weightInLb < 3
            ? 19
            : weightInLb < 4
            ? 26
            : 50,
      };

    default:
      return {
        id: "SHIP_CA",
        label: "International Economy (1-3+ Week)",
        price:
          weightInLb < 0.25
            ? 11
            : weightInLb < 1
            ? 15
            : weightInLb < 2
            ? 19
            : weightInLb < 3
            ? 26
            : weightInLb < 4
            ? 35
            : 75,
      };
  }
}

const button = paypal.Buttons({
  style: {
    layout: "vertical",
    color: "silver",
    shape: "rect",
    label: "buynow",
  },

  createOrder: function (data, actions) {
    const shipping = getShipping("US", kitCount * kitWeight);

    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: (kitPrice * kitCount + shipping.price).toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: (kitPrice * kitCount).toFixed(2),
              },
              shipping: {
                currency_code: "USD",
                id: shipping.id,
                label: shipping.label,
                value: shipping.price.toFixed(2),
              },
            },
          },

          items: [
            {
              name: "frank.af goo kit",
              description: "A virtually lifetime supply",
              unit_amount: {
                currency_code: "USD",
                value: kitPrice.toFixed(2),
              },
              quantity: kitCount.toString(),
            },
          ],
        },
      ],
    });
  },

  onShippingChange: function (data, actions) {
    console.log(data, actions);

    const shipping = getShipping(
      data.shipping_address.country_code,
      kitCount * kitWeight
    );

    const patch = [
      {
        op: "replace",
        path: "/purchase_units/@reference_id=='default'/amount",
        value: {
          currency_code: "USD",
          value: (kitPrice * kitCount + shipping.price).toFixed(2),
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: (kitPrice * kitCount).toFixed(2),
            },

            shipping: {
              currency_code: "USD",
              id: shipping.id,
              label: shipping.label,
              value: shipping.price.toFixed(2),
            },
          },
        },
      },
    ];

    console.log(patch);
    actions.order.patch(patch);
  },

  onApprove: function (data, actions) {
    return actions.order.capture().then(function (orderData) {
      console.log(
        "Capture result",
        orderData,
        JSON.stringify(orderData, null, 2)
      );

      const element = document.getElementById("paypal-buy-container");
      element.innerHTML =
        "<h3>Thank you for your payment!</h3>" +
        "<p>I'll get that out as soon as I can</p>";
    });
  },
});

button.render("#paypal-button-container");
