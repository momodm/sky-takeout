package com.sky.controller.admin;

import com.sky.result.Result;
import com.sky.service.WorkspaceService;
import com.sky.vo.OrderStatisticsVO;
import com.sky.vo.WorkspaceOverviewVO;
import com.sky.vo.WorkspaceRealtimeVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/admin/workspace")
@Api(tags = "工作台接口")
public class WorkspaceController {

    @Autowired
    private WorkspaceService workspaceService;

    @GetMapping("/orderStatistics")
    @ApiOperation("订单统计")
    public Result<OrderStatisticsVO> orderStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime beginTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        // 统计接口支持可选时间范围，方便工作台和报表页共用。
        return Result.success(workspaceService.getOrderStatistics(beginTime, endTime));
    }

    @GetMapping("/overview")
    @ApiOperation("工作台概览")
    public Result<WorkspaceOverviewVO> overview() {
        // 概览接口返回工作台首屏所需的聚合指标。
        return Result.success(workspaceService.getOverview());
    }

    @GetMapping("/realtime")
    @ApiOperation("工作台实时态势")
    public Result<WorkspaceRealtimeVO> realtime() {
        // 实时态势接口为工作台首页和演示页面提供统一数据源。
        return Result.success(workspaceService.getRealtime());
    }
}
