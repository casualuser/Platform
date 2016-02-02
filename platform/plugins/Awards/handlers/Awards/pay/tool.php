<?php

/*
common options list to retrieve from user

    $options['service'] => 'authorize.net',   //'stripe',
    $options['currency'] => 'usd',
    $options['amount'] => '579',
    $options['subscription'] => $subscription

        $subscription['FirstName'] => 'John',
        $subscription['LastName'] => 'Smith',

        $subscription['number'] => '4242424242424242',
        $subscription['exp_year'] => 2018,
        $subscription['exp_month'] => 8,

        $subscription['cvc'] => 101

    Stripe\StripeObject JSON: {
      "id": "sub_7T9hIJATZmCQDa",
      "object": "subscription",
      "application_fee_percent": null,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "current_period_end": 1451879026,
      "current_period_start": 1449200626,
      "customer": "cus_7T9Yc7UmzMDQeJ",
      "discount": null,
      "ended_at": null,
      "metadata": {
      },
      "plan": {
        "id": "gold575",
        "object": "plan",
        "amount": 2000,
        "created": 1386247539,
        "currency": "usd",
        "interval": "month",
        "interval_count": 1,
        "livemode": false,
        "metadata": {
        },
        "name": "New plan name",
        "statement_descriptor": null,
        "trial_period_days": null
      },
      "quantity": 1,
      "start": 1449200626,
      "status": "active",
      "tax_percent": null,
      "trial_end": null,
      "trial_start": null
    }
*/

function Awards_pay_tool($options)
{
    $options = Awards::authPaySetup($options);
    if ($options['service'] == 'stripe') {
        Awards::stripeCharge($options);
    } else if ($options['service'] == 'authorize.net') {
        $customerProfileId = Awards::authCustomerId($options);
        $token = Awards::authToken($options, $customerProfileId);
		$button = Q::ifset($options, 'button', 'Start Subscription');
		Q::view('Awards/tool/pay.php', compact('button', 'token'));
    };
    Awards::topUpAwards($options);
    Q_Response::setToolOptions($options);
};