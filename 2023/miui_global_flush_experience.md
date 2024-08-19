---
author: "Certseeds"
date: "2023-03-19"
lastmod: "2024-08-18"
title: "MIUI global flush experience"
description: "MIUI global flush step by step"
tags: ["Android", "miui", "experience"]
---

# MIUI global flush experience

**IMPORTANT**: THIS ARTICLE IS *DEPRECATED*, THE HYPEROS CAN NOT BE TRUST ANYMORE, PLEASE DO NOT USE IT!(unless you buy it in india, euorpe or malaysia)

it's time to get a new mobile phone, however, the mainland-MIUI can not be trusted because of what they had done, fortunately, we have another choice: the MIUI-global that design for oversea devices.

this short article do not record the full workflow, only pay attention to some import points.

## before-unlock: bind device with account

MIUI devices default status is 'locked', both fastboot and recovery cannot flushing. It must be bound with a miui-account via a SIM-card(can pop up after alert), each miui-account can bind with 4(now, 2023-03-19) devices per year.

maybe miui designers have their opinion, after bind sucess's alert, their do not have a countdown or a lock turn to half-open, it's in a waiting list.

then get the unlock-binary in <https://www.miui.com/unlock/index.html>, the binary can unlock the device or tell you how long time the device have to waiting.

## find the global fastboot

In most common case, after bind, the device can pop up SIM-card, then device have to waiting 168-hours, we have a week to collectting roms!

In the old golden times, miui website will show their all their devices and roms, but now, MIUI do not do that anymore, website do not update and new device can't find global roms. however, you can choose a 3rd-party website, like <https://xiaomirom.com/series/>, searching roms by codename(usually unique for device).

consider the GDPR, someone think global or EEA are better choice, but if you want to get call-record(and free online sms text), the `indonesia`(ID) or `4v`(TW) is a good choice. just download the newest fastboot `tgz` even it's version is far away from newest, it can upgrade in system.

1. the 3rd-party `EU` also don't have call-record!
2. after fastboot, upgrade system will not burn out system, it just *works*!

after get `tgz` in local, unzip it twice to get raw-files.

## unlock bootloader

1. using the unlock-binary in fst step, login account
2. reboot system to fastboot (for miui, put audio's negative button and start button in same time after close system)
3. connect device and PC.
4. unlock in PC.

after this step, the bootloader is unlocked, the applications do not pay attention to that, this device is juat 'can' flush other system.

## flushing

during the 168 hours, we can prepare the flushing-binary.

get it via <http://bigota.d.miui.com/tools/MiFlash2018-5-28-0.zip>(almost 5 years ago), unzip it.

after 168 hours...

1. quit miui-account and google-account (if not, it will lock system!)
2. pop up the SIM card
3. device get into fastboot, connect with PC.
4. start flushing binary, pick rom raw file location, load device.
5. choice 'clear all data'(the leftest one) and begin flushing!

after about five minutes, the device will start automatically.

### start

because of flushing without any account, SIM card and wifi, config do not need login, just continue, and next step.

## transfer configrations and app...

1. the un-mainland system can use google's moving device, but it will not bring a good experience: old and new device connect by a common wifi, make it slow and unstable.
2. `miui.huanji` is a good choice, it at least can transfer system configrations, media and 3rd-party app(without configration file). if the old machine is older version(12-) mainland-miui, some app can transfer config. this app connect old and new device by wifi from new device, which more effective.

## reference

thanks to the website:

+ <https://zhuanlan.zhihu.com/p/408114647>
+ <https://zhuanlan.zhihu.com/p/474378354>
