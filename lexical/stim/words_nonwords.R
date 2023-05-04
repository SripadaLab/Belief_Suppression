dat = read.csv('data.raw.csv') #from https://osf.io/9bdmc/
dat = dat[,c("stim","stim_cat","frequency")]
dat = dat[!duplicated(dat),]
write.csv(dat,"words.csv",row.names=F,quote=F)

dat = read.csv('words.csv')
lfw = unique(dat$stim[dat$stim_cat=="word" & dat$frequency=="low"])
mfw = unique(dat$stim[dat$stim_cat=="word" & dat$frequency=="medium"])
nw =  unique(dat$stim[dat$stim_cat=="nonword"])
length(lfw)
length(mfw)
length(nw)

set.seed(1)
lfw = lfw[lfw != "caf\xe9"]
mfw = mfw[sample(121,40)]
bad = c("murk","dour","nares","goul","terp","woad",
        "cire","dight","fands","frows","hele","peans",
        "scut","sizy","slank","spart","tyke","vides",
        "voce","spake")
nw = nw[!(nw %in% bad)]
nwp = nw[sample(231,40)]
nw1 = setdiff(nw,nwp)
nw2 = nw1[sample(191,120)]
write.table(lfw,"words.txt",row.names=F,col.names=F,quote=T)
write.table(mfw,"practice_words.txt",row.names=F,col.names=F,quote=T)
write.table(nwp,"practice_nonwords.txt",row.names=F,col.names=F,quote=T)
write.table(nw2,"nonwords.txt",row.names=F,col.names=F,quote=T)
