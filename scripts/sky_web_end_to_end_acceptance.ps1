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

function Assert-HttpOk {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Uri,

        [Parameter(Mandatory = $true)]
        [string]$StepName
    )

    try {
        $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -ne 200) {
            throw "$StepName failed with HTTP $($response.StatusCode)"
        }
    } catch {
        throw "$StepName failed: $($_.Exception.Message)"
    }
}

function Assert-PortOpen {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TargetHost,

        [Parameter(Mandatory = $true)]
        [int]$Port,

        [Parameter(Mandatory = $true)]
        [string]$StepName
    )

    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $client.Connect($TargetHost, $Port)
    } catch {
        throw "$StepName failed: $TargetHost`:$Port is not reachable."
    } finally {
        $client.Dispose()
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

    throw "No available dish found for acceptance script."
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
        consignee    = "Codex Acceptance"
        sex          = "1"
        phone        = "13800000009"
        provinceCode = "110000"
        provinceName = "Beijing"
        cityCode     = "110100"
        cityName     = "Beijing"
        districtCode = "110101"
        districtName = "Dongcheng"
        detail       = "Sky Web Acceptance Address"
        label        = "Acceptance"
        isDefault    = 1
    }

    $saveResponse = Invoke-JsonApi -Method Post -Uri "$BaseUrl/user/addressBook" -Headers $Headers -Body $newAddress
    Assert-SuccessCode -Response $saveResponse -StepName "Create default address"

    $setDefaultResponse = Invoke-JsonApi -Method Put -Uri "$BaseUrl/user/addressBook/default" -Headers $Headers -Body @{ id = $saveResponse.data.id }
    Assert-SuccessCode -Response $setDefaultResponse -StepName "Set default address"

    return $saveResponse.data
}

$backendUrl = "http://127.0.0.1:8080"
$nginxUrl = "http://127.0.0.1"
$userCode = "codex-acceptance-" + [DateTimeOffset]::Now.ToUnixTimeSeconds()

# 1. Make sure the main local services are reachable before doing any API work.
Assert-PortOpen -TargetHost "127.0.0.1" -Port 8080 -StepName "Check Spring Boot backend"
Assert-PortOpen -TargetHost "127.0.0.1" -Port 6379 -StepName "Check Redis"
Assert-PortOpen -TargetHost "127.0.0.1" -Port 80 -StepName "Check Nginx"

# 2. Verify that the public frontend and documentation entrypoints respond successfully.
Assert-HttpOk -Uri "$backendUrl/doc.html" -StepName "Check backend API doc page"
Assert-HttpOk -Uri "$nginxUrl/customer/" -StepName "Check customer frontend entry"
Assert-HttpOk -Uri "$nginxUrl/console/" -StepName "Check console frontend entry"

# 3. Log in both sides so the rest of the acceptance flow runs against the real backend.
$adminLogin = Invoke-JsonApi -Method Post -Uri "$backendUrl/admin/employee/login" -Body @{
    username = "admin"
    password = "123456"
}
Assert-SuccessCode -Response $adminLogin -StepName "Admin login"
$adminHeaders = @{ token = $adminLogin.data.token }

$userLogin = Invoke-JsonApi -Method Post -Uri "$backendUrl/user/user/login" -Body @{
    code = $userCode
}
Assert-SuccessCode -Response $userLogin -StepName "User login"
$userHeaders = @{ authentication = $userLogin.data.token }

# 4. Prepare the shop and customer context so one full checkout can happen cleanly.
$shopOpen = Invoke-JsonApi -Method Put -Uri "$backendUrl/admin/shop/1" -Headers $adminHeaders
Assert-SuccessCode -Response $shopOpen -StepName "Open shop"

$dish = Get-FirstNonEmptyDish -BaseUrl $backendUrl
$address = Ensure-DefaultAddress -BaseUrl $backendUrl -Headers $userHeaders

$cleanCart = Invoke-JsonApi -Method Delete -Uri "$backendUrl/user/shoppingCart/clean" -Headers $userHeaders
Assert-SuccessCode -Response $cleanCart -StepName "Clean shopping cart"

$dishFlavor = $null
if ($dish.flavors -and $dish.flavors.Count -gt 0 -and $dish.flavors[0].value) {
    $dishFlavor = $dish.flavors[0].value
}

$addCart = Invoke-JsonApi -Method Post -Uri "$backendUrl/user/shoppingCart/add" -Headers $userHeaders -Body @{
    dishId     = $dish.id
    dishFlavor = $dishFlavor
}
Assert-SuccessCode -Response $addCart -StepName "Add dish to cart"

$submitOrder = Invoke-JsonApi -Method Post -Uri "$backendUrl/user/order/submit" -Headers $userHeaders -Body @{
    addressBookId         = $address.id
    remark                = "Sky Web end-to-end acceptance"
    payMethod             = 1
    estimatedDeliveryTime = (Get-Date).AddMinutes(30).ToString("yyyy-MM-dd HH:mm:ss")
    packAmount            = 2.00
    tablewareNumber       = 2
}
Assert-SuccessCode -Response $submitOrder -StepName "Submit customer order"
$orderId = $submitOrder.data.id
$orderNumber = $submitOrder.data.orderNumber

$payOrder = Invoke-JsonApi -Method Put -Uri "$backendUrl/user/order/payment/$orderId" -Headers $userHeaders
Assert-SuccessCode -Response $payOrder -StepName "Pay order"

# 5. Verify that the same order can move through the console workflow.
$confirmOrder = Invoke-JsonApi -Method Put -Uri "$backendUrl/admin/order/confirm" -Headers $adminHeaders -Body @{ id = $orderId }
Assert-SuccessCode -Response $confirmOrder -StepName "Confirm order"

$deliveryOrder = Invoke-JsonApi -Method Put -Uri "$backendUrl/admin/order/delivery/$orderId" -Headers $adminHeaders
Assert-SuccessCode -Response $deliveryOrder -StepName "Deliver order"

$completeOrder = Invoke-JsonApi -Method Put -Uri "$backendUrl/admin/order/complete/$orderId" -Headers $adminHeaders
Assert-SuccessCode -Response $completeOrder -StepName "Complete order"

# 6. Final read checks from both customer and console views.
$orderDetail = Invoke-JsonApi -Method Get -Uri "$backendUrl/user/order/orderDetail/$orderId" -Headers $userHeaders
Assert-SuccessCode -Response $orderDetail -StepName "Query user order detail"

$historyOrders = Invoke-JsonApi -Method Get -Uri "$backendUrl/user/order/historyOrders?page=1&pageSize=5" -Headers $userHeaders
Assert-SuccessCode -Response $historyOrders -StepName "Query user order history"

$workspaceRealtime = Invoke-JsonApi -Method Get -Uri "$backendUrl/admin/workspace/realtime" -Headers $adminHeaders
Assert-SuccessCode -Response $workspaceRealtime -StepName "Query console workspace realtime"

$orderReport = Invoke-JsonApi -Method Get -Uri "$backendUrl/admin/report/ordersStatistics?begin=2026-03-22&end=2026-03-27" -Headers $adminHeaders
Assert-SuccessCode -Response $orderReport -StepName "Query console orders report"

[pscustomobject]@{
    customerEntryOk     = $true
    consoleEntryOk      = $true
    docEntryOk          = $true
    userId              = $userLogin.data.id
    orderId             = $orderId
    orderNumber         = $orderNumber
    finalStatus         = $orderDetail.data.orders.status
    finalPayStatus      = $orderDetail.data.orders.payStatus
    historyTotal        = $historyOrders.data.total
    todayOrders         = $workspaceRealtime.data.todayOrders
    reportHasData       = [bool]$orderReport.data
    completedAt         = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
} | ConvertTo-Json -Depth 6
