Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-JsonApi {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Method,

        [Parameter(Mandatory = $true)]
        [string]$Uri,

        [hashtable]$Headers,

        [object]$Body
    )

    $params = @{
        Method      = $Method
        Uri         = $Uri
        ErrorAction = "Stop"
    }

    if ($Headers) {
        $params.Headers = $Headers
    }

    if ($null -ne $Body) {
        $params.ContentType = "application/json"
        $params.Body = ($Body | ConvertTo-Json -Depth 8)
    }

    return Invoke-RestMethod @params
}

function Assert-SuccessCode {
    param(
        [Parameter(Mandatory = $true)]
        $Response,

        [Parameter(Mandatory = $true)]
        [string]$StepName
    )

    if ($null -eq $Response -or $Response.code -ne 1) {
        $payload = if ($null -eq $Response) { "null" } else { $Response | ConvertTo-Json -Depth 8 -Compress }
        throw "$StepName failed: $payload"
    }
}

function Get-FirstNonEmptyDish {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl
    )

    $categoriesResponse = Invoke-JsonApi -Method Get -Uri "$BaseUrl/user/category/list?type=1"
    Assert-SuccessCode -Response $categoriesResponse -StepName "Load dish categories"

    foreach ($category in $categoriesResponse.data) {
        $dishResponse = Invoke-JsonApi -Method Get -Uri "$BaseUrl/user/dish/list?categoryId=$($category.id)"
        Assert-SuccessCode -Response $dishResponse -StepName "Load dishes for category $($category.id)"
        if ($dishResponse.data -and $dishResponse.data.Count -gt 0) {
            return $dishResponse.data[0]
        }
    }

    throw "No available dish found for regression"
}

function Ensure-DefaultAddress {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl,

        [Parameter(Mandatory = $true)]
        [hashtable]$Headers
    )

    $defaultResponse = Invoke-JsonApi -Method Get -Uri "$BaseUrl/user/addressBook/default" -Headers $Headers
    if ($defaultResponse.code -eq 1 -and $defaultResponse.data) {
        return $defaultResponse.data
    }

    $newAddress = @{
        consignee    = "Codex Day12"
        sex          = "1"
        phone        = "13800000001"
        provinceCode = "110000"
        provinceName = "Beijing"
        cityCode     = "110100"
        cityName     = "Beijing"
        districtCode = "110101"
        districtName = "Dongcheng"
        detail       = "Day12 Regression Address"
        label        = "Regression"
        isDefault    = 1
    }

    $saveResponse = Invoke-JsonApi -Method Post -Uri "$BaseUrl/user/addressBook" -Headers $Headers -Body $newAddress
    Assert-SuccessCode -Response $saveResponse -StepName "Create default address"

    $setDefaultResponse = Invoke-JsonApi -Method Put -Uri "$BaseUrl/user/addressBook/default" -Headers $Headers -Body @{ id = $saveResponse.data.id }
    Assert-SuccessCode -Response $setDefaultResponse -StepName "Set default address"

    return $saveResponse.data
}

$baseUrl = "http://127.0.0.1:8080"
$userCode = "codex-day12-" + [DateTimeOffset]::Now.ToUnixTimeSeconds()

try {
    Invoke-WebRequest -Uri "$baseUrl/doc.html" -UseBasicParsing -TimeoutSec 5 | Out-Null
} catch {
    throw "Backend is not reachable on $baseUrl. Start sky-server before running this regression script."
}

$redisClient = New-Object System.Net.Sockets.TcpClient
try {
    $redisClient.Connect("127.0.0.1", 6379)
} catch {
    throw "Redis is not reachable on 127.0.0.1:6379. Start redis-server before running this regression script."
} finally {
    $redisClient.Dispose()
}

# 1. Admin login
$adminLogin = Invoke-JsonApi -Method Post -Uri "$baseUrl/admin/employee/login" -Body @{
    username = "admin"
    password = "123456"
}
Assert-SuccessCode -Response $adminLogin -StepName "Admin login"
$adminHeaders = @{ token = $adminLogin.data.token }

# 2. User login
$userLogin = Invoke-JsonApi -Method Post -Uri "$baseUrl/user/user/login" -Body @{
    code = $userCode
}
Assert-SuccessCode -Response $userLogin -StepName "User login"
$userHeaders = @{ authentication = $userLogin.data.token }

# 3. Ensure shop is open
$shopOpen = Invoke-JsonApi -Method Put -Uri "$baseUrl/admin/shop/1" -Headers $adminHeaders
Assert-SuccessCode -Response $shopOpen -StepName "Open shop"

# 4. Load dish and ensure default address
$dish = Get-FirstNonEmptyDish -BaseUrl $baseUrl
$address = Ensure-DefaultAddress -BaseUrl $baseUrl -Headers $userHeaders

# 5. Reset cart and add one dish
$cleanCart = Invoke-JsonApi -Method Delete -Uri "$baseUrl/user/shoppingCart/clean" -Headers $userHeaders
Assert-SuccessCode -Response $cleanCart -StepName "Clean shopping cart"

$dishFlavor = $null
if ($dish.flavors -and $dish.flavors.Count -gt 0 -and $dish.flavors[0].value) {
    $dishFlavor = $dish.flavors[0].value
}

$addCart = Invoke-JsonApi -Method Post -Uri "$baseUrl/user/shoppingCart/add" -Headers $userHeaders -Body @{
    dishId = $dish.id
    dishFlavor = $dishFlavor
}
Assert-SuccessCode -Response $addCart -StepName "Add dish to shopping cart"

# 6. Submit order and pay
$submitOrder = Invoke-JsonApi -Method Post -Uri "$baseUrl/user/order/submit" -Headers $userHeaders -Body @{
    addressBookId          = $address.id
    remark                 = "Day 12 final regression"
    payMethod              = 1
    estimatedDeliveryTime  = (Get-Date).AddMinutes(30).ToString("yyyy-MM-dd HH:mm:ss")
    packAmount             = 2.00
    tablewareNumber        = 2
}
Assert-SuccessCode -Response $submitOrder -StepName "Submit order"
$orderId = $submitOrder.data.id

$payOrder = Invoke-JsonApi -Method Put -Uri "$baseUrl/user/order/payment/$orderId" -Headers $userHeaders
Assert-SuccessCode -Response $payOrder -StepName "Pay order"

# 7. Move order through admin workflow
$confirmOrder = Invoke-JsonApi -Method Put -Uri "$baseUrl/admin/order/confirm" -Headers $adminHeaders -Body @{ id = $orderId }
Assert-SuccessCode -Response $confirmOrder -StepName "Confirm order"

$deliveryOrder = Invoke-JsonApi -Method Put -Uri "$baseUrl/admin/order/delivery/$orderId" -Headers $adminHeaders
Assert-SuccessCode -Response $deliveryOrder -StepName "Deliver order"

$completeOrder = Invoke-JsonApi -Method Put -Uri "$baseUrl/admin/order/complete/$orderId" -Headers $adminHeaders
Assert-SuccessCode -Response $completeOrder -StepName "Complete order"

# 8. Final verification endpoints
$orderDetail = Invoke-JsonApi -Method Get -Uri "$baseUrl/user/order/orderDetail/$orderId" -Headers $userHeaders
Assert-SuccessCode -Response $orderDetail -StepName "Query order detail"

$historyOrders = Invoke-JsonApi -Method Get -Uri "$baseUrl/user/order/historyOrders?page=1&pageSize=5" -Headers $userHeaders
Assert-SuccessCode -Response $historyOrders -StepName "Query history orders"

$workspaceRealtime = Invoke-JsonApi -Method Get -Uri "$baseUrl/admin/workspace/realtime" -Headers $adminHeaders
Assert-SuccessCode -Response $workspaceRealtime -StepName "Query workspace realtime"

$orderReport = Invoke-JsonApi -Method Get -Uri "$baseUrl/admin/report/ordersStatistics?begin=2026-03-22&end=2026-03-25" -Headers $adminHeaders
Assert-SuccessCode -Response $orderReport -StepName "Query order report"

[pscustomobject]@{
    userId                 = $userLogin.data.id
    orderId                = $orderId
    finalStatus            = $orderDetail.data.orders.status
    finalPayStatus         = $orderDetail.data.orders.payStatus
    historyTotal           = $historyOrders.data.total
    realtimeTodayOrders    = $workspaceRealtime.data.todayOrders
    reportHasData          = [bool]$orderReport.data
    completedAt            = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
} | ConvertTo-Json -Depth 6
