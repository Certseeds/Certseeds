---
author: "Certseeds"
date: "2022-06-05"
title: "Instant And Duration Process In DataBase"
description: "Instant And Duration Process In DataBase"
tags: ["java", "experience"]
---

# Instant And Duration Process In DataBase

## start

sometimes we'd like to save the logs in Databse, like save all download(and streaming) music history of a user. In this process, we will build a database for that target.

``` sql
create database if not exists Instant_And_Duration_Process_In_DataBase DEFAULT CHARACTER SET utf8mb4 collate utf8mb4_unicode_ci;
create table NETHARD_MUSIC_DOWNLOAD_HISTORY(
    `id`             BIGINT      NOT NULL auto_increment COMMENT 'autoid',
    `user_id` BIGINT NOT NULL COMMENT 'user id',
    `music_id` BIGINT NOT NULL COMMENT 'download music id',
    `download_time` BIGINT NOT NULL COMMENT 'download begin time',
    `download_music_flow` BIGINT NOT NULL COMMENT 'download music size',
    `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE,
)
```

## analysis the DOWNLOAD_HISTORY_TABLE

from the `NETHARD_MUSIC_DOWNLOAD_HISTORY`, we can find that we comment the `download_time` a 'download begin time'. usually the download-operation is managed by the application itself: only if local do not contain music and music is not downloading, it's can be download. once in the downloaing process or downloaded, the download botton is always gray-can not click. what's more, download a music usually success while a short time, the failing will also appear at a short rest but without so frequently

The final and most important reason: the aim of this filed do not pay attention to the downloading-continue-time. this table aim to collect the downloading history and filter those abuse-downloading users. so it just consider begintime, and filter by begintime and flowcost for users.

## Instant-Event and Duration-Event

Now we will introduce two type of events: the Instant-Event and Duration-Event, example of 1st containes visiting history, downloading history, music-listening-order, daily login and other events that be considered happend Immediately(cost 0 ms); the 2nd's examples usually appear as the analysion-values(not like 1st that always be added to database only after a short rest), they usually rely on single or multiply database tables.

for the 1st type of event, things happen and then the a line be add to a database; for the 2nd type of event, after a constant sleep or from a constant-scheduled-service, one application begin to consumer the produced items by other system until it consumed a item that should be consumed as the last cycle.

the two type of events is different, the 1st one log something happen, the 2nd combine them to produce a analysis value in a time-range, so it should have different store ways in database.

## Instant-Event

For Instant-Event, start-time or finish-time(usually tell server by call-back). they are all immediately events.
When you click the daily-checkin button, it will send reqeust to insert a history in database; when loading the page, the web broswer's loading event will be invoke after page is loaded, then javascript function will be eval, this is the finish-time example, javascript-functions is call by broswer as callback.

After all, they should be store in database as `BIGINT(20)`,or named as `uint64_t` `long` `u64i`.

Because those event usually be store as a millseconds, when searching the Database, we can get it by a `left close, right open`(write as `[)`). if ignore the overlap, you can even use `left close and right close`, the right close or not just influence a mill-seconds, 1/1000 of a second.

## Duration-Event

For Duration-Event, it Both has StartTime and FinishTime, and of course both are meaningful.

someone store durations in database with only startTime or endTime, What's worse, they do not write it's startTime or EndTime, only name it `StatTime` or even `time`.

That is really a bad idea, user can not know the duration length, they should analysis the item by a document(or by guess), if not(or guess), they will make a mistake.

If user know the filed is startTime or endTime, They should pay attention to this filed when working accross tables, some table have different designer and has opposite idea, one use startTime and the other use endTime.

if table only use startTime or Endtime, user will find they have to escape the overlap of boundary value, once overlap happen, a duration will be count mulitply times(or sometimes it's ignored, none analysis it).

### example

we suppore There exists three tables, `monthly`,`daily` and `hourly`

|   table   | type                                                                                       |
| :-------: | :----------------------------------------------------------------------------------------- |
| `monthly` | use `1640966400000`(2022-01-01 00:00:00) to save `2022-01-01 to 2022-02-01`'                  |
|  `daily`  | use `1643731200000`(2022-02-02 00:00:00) to save `2022-02-01 00:00:00 to 2022-02-02 00:00:00` |
|  `houly`  | use `1643738400000`(2022-02-02 02:00:00) to save `2022-02-02 02:00:00 to 2022-02-02 03:00:00` |

if date is `2022-03-03 03:33:33`, you'd like to get data from database.

1. get `2022-01-01 to 2022-03-01`, 
`2022-01-01 00:00:00` is `1640966400000`

the start of this month is `ZonedDataTime.now(Constants.DefaultZone).withStartOfMonth().withHours(0).withMinute(0).withSecond(0).withNano(0)`, transftr it to mills is 1646064000000

sql should be  `... where 1640966400000 <= time   and time < 1646064000000`

2. get `2022-03-01 00:00:00 to 2022-03-03 00:00:00`

maybe you'd like use the startOfThisMonth as begin time, but it is not ok! what if monthly do not appear by a mistake? the begin time should be max(beginOfYear,Selected Time).

after get max, the time stamp is `1643644800000`(2022-02-01 00:00:00), so you need to `TimeUnit.Month.toMills(1)` to get `1646064000000`(2022-03-01 00:00:00), then get `ZonedDataTime.now(Constants.DefaultZone).withHours(0).withMinute(0).withSecond(0).withNano(0)` as `1646236800`(2022-03-01 00:00:00)

sql should be `... where 1646064000000 < time and time <= 1646236800000`

3. get `2022-03-03 00:00:00 to 2022-03-03 03:00:00`

for the same reason, beginTime come from std::max,

`1646236800000`(2022-03-03 00:00:00)
`1646247600000`(2022-03-03 03:00:00)

sql should be `... where 1646236800000 <= time and time < 1646247600000`

we can find that, tables have different choice will make time range like overlap but not overlap in fact, it do not help coding at all but includeing problems.

if choice startTime and endTime, all statment can be select by `${startTime} <= startTime and endTime<=${endTime}`,do not need plus days or minus Month. selected time can be use in next sql because the last one's endTime do not influence next startTime.

## conclusion

+ There exist two type of events in database:
  + [x] Instant Event
  + [x] Duration Event
+ Instant Event should store a uint64_t as startTime or endTime
+ Duration Event should store a filed named startTime and a filed named endTime, it will save time in searching in db and make analysis more easy'

本质上是信息量的问题

+ Instant事件只需要一个时间点
+ Duration事件需要两个时间点,如果数据库里不存两个时间点,就要有额外的信息注入进来,文档内约定,db里的时间戳到底是开始还是结束,以及持续时间是多长