---
author: "Certseeds"
date: "2024-08-17"
lastmod: "2024-08-21"
title: "oneplus_breathing_oxygen"
description: "log of breathing oxygen on oneplus"
tags: ["Android", "flushing-system", "experience"]
---

# oneplus_breathing_oxygen

## steps

1. open the developer mode
2. turn "OEM unblock" on(via daxiaamu toolbox)
3. root system
4. backup the img files(lots of)
5. flush system to oxygen(india or eea)
6. flush ocdt and op

## step1 and step2

### step1

step1 just need click the correct position, do it by yourself.

### step2

1. enable USB debugging.
2. `adb reboot bootloader`
3. `fastboot flashing unlock` or `fastboot oem unlock `

then reboot to system, it's unblolcked.

PS: if you do not want to using adb, you can try daxiaamu's toolbox

## step3 root system

PS: please ensure the computer had install fastboot driver.

1. install a full-package(contains a big file named payload.bin) of your system, it's version should match the Android devices' version.
2. using `payload-dumper-go` to export the init_boot.img(and backup this file)
3. copy it to `device/Download/init_boot.img`
4. install Magick(get via gh) and patch `init_boot.img` to `magisk_patched-xxx.img`
5. install a `adb-fastboot` tool, unzip and copy `magisk_patched-xxx.img` to it's folder
6. open usb-debugging and connect the device to computer
7. run cmd.bat and `adb reboot bootloader`
8. run `fastboot devices` or `fastboot getvar product` to check fastboot can find the device
9. run `fastboot flash init_boot magisk_patched-xxx.img`
10. it will output

``` log
Sending 'init_boot' (8192 KB) OKAY [ 0.195s]
Writing 'init_boot'           OKAY [ 0.003s]
Finished. Total time: 0.240s
```

then `fastboot reboot`

11. open magick, the magick-app will derive you to reboot, do it once again.

PS: if you wang to unroot, just flash the original `init_boot.img` to the device(or you find the package.bin of system version and "dumper" it out once more).

> referer:
>
> + <https://magiskcn.com/oneplus-init-boot>
>
> + <https://magiskcn.com/payload-dumper-go-init-boot>


TODO: <https://5ec.top/00-notes/android/oneplus12-root-with-magisk-delta>

## step4 backup the img files

### method 1 using multi-system toolbox

1. open the multi-system toolbox
2. export the img files to /sdcard/Rannki
3. backup the img files to another safe position

### method 2 using adb

``` shell
adb shell
su
dd if=/dev/block/bootdevice/by-name/ocdt of=/sdcard/Download/ocdt.img
dd if=/dev/block/bootdevice/by-name/persist of=/sdcard/Download/persist.img
dd if=/dev/block/bootdevice/by-name/oplusstanvbk_a of=/sdcard/Download/oplusstanvbk_a.img
dd if=/dev/block/bootdevice/by-name/oplusstanvbk_b of=/sdcard/Download/oplusstanvbk_b.img
```

the oplusstanvbk_a and oplusstanvbk_b are same, rename one of them to oplusstanvbk.img

## step5 flash system to oxygen

1. pop up the SIM cards

### prepare files

1. download a `old9008flash.zip`
2. download a 'OFP' package of your target oxygen area, it's really big, bigger than the 'detla update package' and the 'full update package'. and it seems just exist oldder version like 14.0.0.307.
3. prepare a copyable `adb-fastboot` folder(from pre steps), maybe you need to another machine to run it.
4. prepare fastboot_driver_64.exe, same reason to with 3.
5. for `adb-fastboot` folder, copy and rename dst folder to `flash_op_odct`
6. download a `ocdt.img` from oxygen os(call it `ocdt-oss.img`), it's only for flashing, you still need your own ocdt.img after update system to target-newest.

now the floder struct looks like

``` bash
pwd
~/oss
tree -L 1
.
├── old9008flash.zip
├── adb-fastboot
├── flash_op_odct
├── OFP.zip
└── ocdt-oss.img
```

7. preparing the `import-files folder`

``` bash
$ cd ~/oss
$ mkdir backup
$ pwd
~/oss/backup
$ cp YOUR_BACKUPED_IMG_FILES/ocdt.img ./ocdt.img
$ cd ..
$ pwd
~/oss
$ unzip ./OFP.zip ./OFP
$ cd ./OFP/IMAGES
$ pwd
~/oss/OFP/IMAGES
$ cp ./init_boot.img ~/oss/backup/init_boot.img
$ echo 'if you want to flash with root, do the patching tasks and rename it from magick_patched-xxx.img to init_boot.img'
$ cp ./prog_firehose_ddr.elf ~/oss/backup/prog_firehose_ddr.elf
$ cd ~/oss/backup
$ tree
.
├── ocdt.img (from your device backup)
├── init_boot.img (from OFP package, or patched by magisk)
└── prog_firehose_ddr.elf (from OFP package)
```

8. unzip the `old9008flash.zip` to `~/oss/Oneplus11-9008Flash`

``` bash
pwd
~/oss
tree -L 1
.
├── backup
├── old9008flash.zip
├── Oneplus11-9008Flash
├── adb-fastboot
├── flash_op_odct
├── OFP.zip
├── OFP
└── ocdt-oss.img
```

9. flash the `ocdt-oss.img` to device

``` bash
$ pwd
~/oss
$ cp ./adb-fastboot ./flash_oss_odct
$ cd ./flash_oss_odct
$ cp ~/oss/ocdt-oss.img ~/oss/flash_oss_odct/ocdt-oss.img
$ cd ~/oss/flash_oss_odct
adb devices
adb reboot fastboot
fastboot devices
fastboot flash ocdt ocdt-oss.img
```

then reboot to system, unconnect with PC.

10. steps about the `Oneplus11-9008Flash`

``` bash
$ cd ~/oss/Oneplus11-9008Flash
$ sudo ./open_flashing_tool.bat
```

+ login with 11@11 && echo 'check-code 11'
+ import the OFP package `~/oss/OFP`
+ the package is imported, click flush button to begin checking-hash of the package
+ wait a few minutes
+ trun on default-nation-code

``` bash
$ cp ~/oss/backup/ocdt.img ~/oss/OFP/IMAGES/ocdt.img
$ cp ~/oss/backup/init_boot.img ~/oss/OFP/IMAGES/init_boot.img
$ cp ~/oss/Oneplus11-9008Flash/prog_firehose_ddr.elf ~/oss/OFP/prog_firehose_ddr.elf
```

+ trun off the device, wait 10+ seconds, click voice+ and voice- 10+ seconds, connect with PC.
+ click begining-flush button.
+ waiting for a few minutes, the device will reboot to oxygenOS

However, the device will have NO-WIFI and NO-IMEI, you need to flash the `ocdt.img`&`op` to device again.

## step6 flush ocdt and op

in oxygen system, open the developer mode, (OEM unblock had been unblocked), and open debugging mode again.

``` bash
$ cd ~/oss/flash_op_odct
$ cp YOUR_BACKUPED_IMG_FILES/ocdt.img ./ocdt.img
$ cp YOUR_BACKUPED_IMG_FILES/oplusstanvbk.img ./oplusstanvbk.img
$ or you can using the oplusstanvbk.img from download `flash-with-one-button`
$ adb reboot fastboot && echo 'then will reboot to recovery state'
$ fastboot flash oplusstanvbk oplusstanvbk.img
$ fastboot flash ocdt ocdt.img
```

in the flash_double stage, the script maybe output "\<waiting for any devices\>"

+ check the PC had installed the fastboot driver
+ check there exist other adb shells?
+ maybe reboot the PC and try again
+ or you can transfer the `~/oss/flash_op_odct` to another PC and try again.

in the end, after a few times retry, the double img will be flashed, enjoy the oxygenOS(old version)!

## after update oxygen-os with full-update-pacakge

between small versions, system will use delta-update-pacakge, but in our updated system, it can not pass the checking-stage, after 2-3 times retry, system will decide to use full-update-pacakge.

after success reboot to systen, you will find the WIFI or IMEI dissppeared, you need to flash the `ocdt.img` and `op` to device again, just do it like step6.
