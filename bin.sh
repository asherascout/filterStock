#!/bin/bash
cd ~/Documents/filterStock/
mkdir Stock/
node getstock.js
node getKDJ.js
awk 'NR>1{print $3 "\t" $1 "\t" $2 "\t" $4 "\t" $5}' ./Stock/stockKDJ.txt | sort -n | awk '{if ($1 - $3 > -5 && $1 - $3 < 5 && $1 < 40 && $5 > 0) { print $1 "\t" $2 "\t" $3 "\t" $4 "\t" $5}}' | sed -n '1,200p' | awk 'BEGIN{print "stock_ID\tK\tD\tJ\tK_slope"}{print $2 "\t" $3 "\t" $1 "\t" $4 "\t" $5}' > result_low.txt
awk 'NR>1{print $3 "\t" $1 "\t" $2 "\t" $4 "\t" $5}' ./Stock/stockKDJ.txt | sort -n | awk '{if ($1 - $3 > -1 && $1 - $3 < 1 && $1 < 70 && $5 > 0) { print $1 "\t" $2 "\t" $3 "\t" $4 "\t" $5}}' | sed -n '1,200p' | awk 'BEGIN{print "stock_ID\tK\tD\tJ\tK_slope"}{print $2 "\t" $3 "\t" $1 "\t" $4 "\t" $5}' > result_0.txt
echo "result saved."
#rm ./Stock/stockKDJ.txt