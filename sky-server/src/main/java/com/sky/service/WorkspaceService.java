package com.sky.service;

import com.sky.vo.OrderStatisticsVO;
import com.sky.vo.WorkspaceOverviewVO;
import com.sky.vo.WorkspaceRealtimeVO;

import java.time.LocalDateTime;

public interface WorkspaceService {

    OrderStatisticsVO getOrderStatistics(LocalDateTime beginTime, LocalDateTime endTime);

    WorkspaceOverviewVO getOverview();

    WorkspaceRealtimeVO getRealtime();
}
