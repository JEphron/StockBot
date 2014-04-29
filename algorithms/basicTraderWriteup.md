/////////////////////////////////////////////////

// Condition         =>      Response       

/////////////////////////////////////////////////

Price the same as last timestep = > Hold

Price increasing at a moderate rate above purchasePrice = > Sell smaller percentage

Price was increasing above purchasePrice but is now decreasing = > increase sell rate

Price spiking upwards past purchasePrice = > Sell large percentage

Price spiking down past stop - limit = > Hold and wait

for rebound, or buy( ? )

Price drifting below stop - limit = > Sell



Method:



calculate exponential moving average

for 10,

20,

and 40 minute periods ?

if last_price == current_price then nothing

if holding and current_price > purchase_point and moving_average_angle < 45 degrees then sell small %

if holding and current_price > purchase_point and moving_average_angle > 45 degrees then sell large %

if holding and above purchase_point and was increasing but is now decreasing then sell

if not holding and price is lower than average then buy






Unrelated potential issues : local FUNDS variable could become desynced with server 

	- FIXED - engine now pulls remaining funds data from marketwatch.

